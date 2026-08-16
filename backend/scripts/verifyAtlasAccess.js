require('dotenv').config();
const mongoose = require('mongoose');
const { redact } = require('../src/services/logger');

const fail = (message) => {
  throw new Error(message);
};

const main = async () => {
  const uri = process.env.MONGO_URI || '';
  const expectedDb = process.env.MONGO_DB_NAME || '';
  if (!uri.startsWith('mongodb+srv://')) fail('MONGO_URI must be an Atlas mongodb+srv connection string');
  if (!expectedDb) fail('MONGO_DB_NAME is required');

  const uriDb = decodeURIComponent(new URL(uri).pathname.replace(/^\//, '').split('/')[0] || '');
  if (uriDb !== expectedDb) fail('MONGO_URI does not target MONGO_DB_NAME');

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 1,
    minPoolSize: 0,
  });

  if (mongoose.connection.name !== expectedDb) fail('Atlas connected to an unexpected database');
  await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();

  const status = await mongoose.connection.db.admin().command({
    connectionStatus: 1,
    showPrivileges: true,
  });
  const roles = status?.authInfo?.authenticatedUserRoles || [];
  if (!roles.some(({ role, db }) => role === 'readWrite' && db === expectedDb)) {
    fail('Application user is missing readWrite on MONGO_DB_NAME');
  }
  if (roles.some(({ role, db }) => db !== expectedDb || role !== 'readWrite')) {
    fail('Application user has roles outside readWrite on MONGO_DB_NAME');
  }

  let unrelatedAccessDenied = false;
  try {
    await mongoose.connection.useDb('tammewar_privilege_probe').collection('probe').findOne({});
  } catch (err) {
    unrelatedAccessDenied = err?.code === 13 || err?.codeName === 'Unauthorized';
  }
  if (!unrelatedAccessDenied) fail('Application user can access an unrelated database');

  console.log(JSON.stringify({
    atlasConnection: 'ok',
    database: expectedDb,
    role: 'readWrite',
    unrelatedDatabaseAccess: 'denied',
  }));
};

main()
  .catch((err) => {
    console.error(`[atlas-verify] ${redact(err.message || err.name || 'Verification failed')}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
