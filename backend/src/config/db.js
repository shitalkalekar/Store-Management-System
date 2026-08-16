const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    minPoolSize: env.NODE_ENV === 'production' ? 2 : 0,
  });
  console.log('[db] connected successfully');
  return mongoose.connection;
}

async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDb, disconnectDb, isDbReady };
