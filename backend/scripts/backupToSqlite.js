const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sqlite3;
try {
  sqlite3 = require('sqlite3');
} catch (e) {
  // SQLite3 module will be available after npm install
}

// Helpers for async SQLite operations using sqlite3
const openSqliteDb = (filepath) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filepath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
};

const runSql = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const closeSqliteDb = (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Custom serializer preserving MongoDB BSON types (ObjectId, Date, etc.)
const serializeDoc = (doc) => {
  return JSON.stringify(doc, (key, value) => {
    if (value && typeof value === 'object') {
      if (value._bsontype === 'ObjectID' || value.constructor?.name === 'ObjectId') {
        return { $oid: value.toString() };
      }
      if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && key.toLowerCase().includes('date'))) {
        // preserve date object
      }
    }
    return value;
  });
};

const runBackupToSqlite = async (targetDir = null) => {
  if (!sqlite3) {
    sqlite3 = require('sqlite3');
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_information_system';
  console.log('[backupToSqlite] Connecting to MongoDB...');
  
  let isConnectedLocal = false;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    isConnectedLocal = true;
  }

  try {
    const timestamp = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0];
    const baseBackupDir = targetDir || path.join(__dirname, '../backups/sqlite', `backup_${timestamp}`);

    if (!fs.existsSync(baseBackupDir)) {
      fs.mkdirSync(baseBackupDir, { recursive: true });
    }

    const nativeDb = mongoose.connection.db;
    const collections = await nativeDb.listCollections().toArray();
    console.log(`[backupToSqlite] Found ${collections.length} collections in MongoDB.`);

    const manifest = {
      backupTime: new Date().toISOString(),
      mongoUri: mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
      totalCollections: collections.length,
      totalDocuments: 0,
      collections: {}
    };

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const sqliteFilePath = path.join(baseBackupDir, `${colName}.sqlite`);
      const db = await openSqliteDb(sqliteFilePath);

      // Create table
      await runSql(db, `CREATE TABLE IF NOT EXISTS records (
        _id TEXT PRIMARY KEY,
        json_data TEXT NOT NULL,
        updated_at TEXT
      )`);

      const docs = await nativeDb.collection(colName).find({}).toArray();
      console.log(`[backupToSqlite] Backing up collection "${colName}" (${docs.length} docs) -> ${path.basename(sqliteFilePath)}`);

      await runSql(db, 'BEGIN TRANSACTION');
      for (const doc of docs) {
        const idStr = doc._id ? doc._id.toString() : new mongoose.Types.ObjectId().toString();
        const jsonStr = JSON.stringify(doc);
        const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString();

        await runSql(
          db,
          `INSERT OR REPLACE INTO records (_id, json_data, updated_at) VALUES (?, ?, ?)`,
          [idStr, jsonStr, updatedAt]
        );
      }
      await runSql(db, 'COMMIT');
      await closeSqliteDb(db);

      manifest.collections[colName] = {
        fileName: `${colName}.sqlite`,
        documentCount: docs.length
      };
      manifest.totalDocuments += docs.length;
    }

    const manifestPath = path.join(baseBackupDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`[backupToSqlite] Backup successful! ${manifest.totalDocuments} total documents exported across ${Object.keys(manifest.collections).length} SQLite database files.`);
    console.log(`[backupToSqlite] Backup stored at: ${baseBackupDir}`);

    return {
      success: true,
      backupDir: baseBackupDir,
      manifest
    };
  } finally {
    if (isConnectedLocal) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  runBackupToSqlite()
    .then((res) => {
      console.log('[backupToSqlite] Task completed cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[backupToSqlite] Backup failed with error:', err);
      process.exit(1);
    });
}

module.exports = { runBackupToSqlite };
