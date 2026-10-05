const mongoose = require('mongoose');
const { connectDb, disconnectDb } = require('./src/config/db');
const User = require('./src/models/user');

const main = async () => {
  // Use a default local MongoDB URI if not provided
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/result_analysis_db';
  await connectDb();

  const email = 'shitalkalekar05@gmail.com';
  const password = 'Shital@#032003';

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists, updating password...');
      existingUser.password = password;
      await existingUser.save();
      console.log('Password updated.');
    } else {
      console.log('Creating new user...');
      const user = new User({
        email,
        password,
        role: 'admin',
        name: 'Shital Kalekar',
        mobile: '0000000000',
        status: 'Active'
      });
      await user.save();
      console.log('User created successfully.');
    }
  } catch (err) {
    console.error('Error inserting user:', err);
  } finally {
    await disconnectDb().catch(() => {});
  }
};

main();
