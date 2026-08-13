const mongoose = require('mongoose');
const env = require('./env');

async function connectDb() {
  mongoose.set('strictQuery', true);
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 20,
    minPoolSize: env.NODE_ENV === 'production' ? 2 : 0,
  });
  console.log('[db] connected successfully to:', env.MONGO_URI.split('@').pop());
  return mongoose.connection;
}

module.exports = { connectDb };
