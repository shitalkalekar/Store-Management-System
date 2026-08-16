require('dotenv').config();
const app = require('./src/app');
const { connectDb, disconnectDb } = require('./src/config/db');
const env = require('./src/config/env');
const { initCron } = require('./src/services/cronService');
const logger = require('./src/services/logger');

const autoSeed = async () => {
  try {
    const User = require('./src/models/user');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[seed] Database is empty. Auto-seeding initial shop admin and staff users...');
      
      // Initial administrator credentials must come from the environment.
      const admin = new User({
        email: env.INITIAL_ADMIN_EMAIL,
        password: env.INITIAL_ADMIN_PASSWORD,
        role: 'admin',
        name: env.INITIAL_ADMIN_NAME,
        mobile: env.INITIAL_ADMIN_MOBILE,
        status: 'Active'
      });
      await admin.save();
      console.log('[seed] Initial administrator created from environment configuration');

      // Default Setting
      const Setting = require('./src/models/setting');
      const setting = new Setting({
        companyName: 'Apex Medical Shop',
        address: 'Pune, Maharashtra',
        email: env.INITIAL_ADMIN_EMAIL,
        contact: env.INITIAL_ADMIN_MOBILE
      });
      await setting.save();
      console.log('[seed] Default settings created.');
      console.log('[seed] Auto-seeding complete! ✅');
    }
  } catch (err) {
    console.error('[seed] Auto-seed failed (will skip):', err.message);
  }
};

let server;
let shuttingDown = false;

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.write('info', 'server_shutdown_started', { signal });

  const forceExit = setTimeout(() => {
    logger.write('error', 'server_shutdown_timeout');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    }
    await disconnectDb();
    clearTimeout(forceExit);
    logger.write('info', 'server_shutdown_complete');
    process.exit(0);
  } catch (err) {
    logger.write('error', 'server_shutdown_failed', logger.errorDetails(err));
    process.exit(1);
  }
};

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));

(async () => {
  try {
    env.assertSafeConfiguration();
    await connectDb();
    if (env.AUTO_SEED) await autoSeed();
    if (env.WHATSAPP_ENABLED) require('./src/services/whatsappClient');
    initCron();
    
    server = app.listen(env.PORT, env.HOST, () => {
      console.log('[shop-management] backend listening on http://' + env.HOST + ':' + env.PORT);
    });
  } catch (err) {
    logger.write('error', 'server_startup_failed', logger.errorDetails(err));
    await disconnectDb().catch(() => {});
    process.exit(1);
  }
})();
