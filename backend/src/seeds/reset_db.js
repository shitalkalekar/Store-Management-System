const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../../.env' });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sisdb';
mongoose.connect(mongoUri).then(async () => {
    console.log(`Dropping db at ${mongoUri}`);
    await mongoose.connection.db.dropDatabase();
    console.log('Dropped');
    process.exit(0);
});
