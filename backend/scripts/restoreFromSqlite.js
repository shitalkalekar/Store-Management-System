const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Helpers for async SQLite operations using sqlite3
const openSqliteDb = (filepath) => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filepath, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
};

const queryAllSql = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
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

// Revive MongoDB BSON types (ObjectIds, Dates, etc.)
const reviveMongoDoc = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(reviveMongoDoc);
  }

  const revived = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];

    if (key === '_id') {
      if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
        revived[key] = new mongoose.Types.ObjectId(val);
      } else if (val && val.$oid) {
        revived[key] = new mongoose.Types.ObjectId(val.$oid);
      } else {
        revived[key] = val;
      }
      continue;
    }

    if (val && typeof val === 'object') {
      if (val.$oid) {
        revived[key] = new mongoose.Types.ObjectId(val.$oid);
      } else if (val.$date) {
        revived[key] = new Date(val.$date);
      } else {
        revived[key] = reviveMongoDoc(val);
      }
    } else if (
      typeof val === 'string' &&
      (key.endsWith('At') || key.endsWith('Date') || key === 'date' || key === 'dob') &&
      !isNaN(Date.parse(val))
    ) {
      revived[key] = new Date(val);
    } else {
      revived[key] = val;
    }
  }

  return revived;
};

// Find latest backup folder if non specified
const getLatestBackupDir = () => {
  const baseDir = path.join(__dirname, '../backups/sqlite');
  if (!fs.existsSync(baseDir)) return null;

  const entries = fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && dirent.name.startsWith('backup_'))
    .map((dirent) => dirent.name)
    .sort()
    .reverse();

  if (entries.length === 0) return null;
  return path.join(baseDir, entries[0]);
};

const runRestoreFromSqlite = async (customBackupDir = null) => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student_information_system';
  
  let backupDir = customBackupDir;
  if (!backupDir) {
    const dirArg = process.argv.find((arg) => arg.startsWith('--dir=') || arg.startsWith('--backup='));
    if (dirArg) {
      backupDir = dirArg.split('=')[1];
    } else {
      backupDir = getLatestBackupDir();
    }
  }

  if (!backupDir || !fs.existsSync(backupDir)) {
    throw new Error(`[restoreFromSqlite] Backup directory not found: ${backupDir || 'No SQLite backups exist in backend/backups/sqlite'}`);
  }

  console.log(`[restoreFromSqlite] Using backup directory: ${backupDir}`);
  console.log('[restoreFromSqlite] Connecting to MongoDB Atlas...');

  let isConnectedLocal = false;
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(mongoUri);
    isConnectedLocal = true;
  }

  try {
    const nativeDb = mongoose.connection.db;

    // Check for manifest.json
    const manifestPath = path.join(backupDir, 'manifest.json');
    let manifest = null;
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.sqlite'));
    if (files.length === 0) {
      console.log('[restoreFromSqlite] No .sqlite database files found in backup directory.');
      return { success: false, restoredDocs: 0 };
    }

    console.log(`[restoreFromSqlite] Found ${files.length} collection SQLite databases to restore.`);

    let totalRestoredDocs = 0;
    const summary = {};

    for (const file of files) {
      const colName = file.replace(/\.sqlite$/, '');
      const sqliteFilePath = path.join(backupDir, file);

      const db = await openSqliteDb(sqliteFilePath);
      const rows = await queryAllSql(db, 'SELECT _id, json_data FROM records');
      await closeSqliteDb(db);

      if (rows.length === 0) {
        summary[colName] = 0;
        continue;
      }

      console.log(`[restoreFromSqlite] Restoring collection "${colName}" (${rows.length} docs from ${file})...`);

      const bulkOps = rows.map((row) => {
        const parsed = JSON.parse(row.json_data);
        const revivedDoc = reviveMongoDoc(parsed);
        return {
          replaceOne: {
            filter: { _id: revivedDoc._id },
            replacement: revivedDoc,
            upsert: true
          }
        };
      });

      const colRef = nativeDb.collection(colName);
      // Execute bulkWrite in batches of 500
      const batchSize = 500;
      for (let i = 0; i < bulkOps.length; i += batchSize) {
        const batch = bulkOps.slice(i, i + batchSize);
        await colRef.bulkWrite(batch, { ordered: false });
      }

      summary[colName] = rows.length;
      totalRestoredDocs += rows.length;
    }

    console.log('[restoreFromSqlite] Restore complete! Breakdown by collection:');
    console.table(summary);
    console.log(`[restoreFromSqlite] Successfully restored ${totalRestoredDocs} documents to MongoDB Atlas.`);

    return {
      success: true,
      totalRestoredDocs,
      summary
    };
  } finally {
    if (isConnectedLocal) {
      await mongoose.disconnect();
    }
  }
};

if (require.main === module) {
  runRestoreFromSqlite()
    .then((res) => {
      console.log('[restoreFromSqlite] Restoration completed cleanly.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[restoreFromSqlite] Restoration failed:', err);
      process.exit(1);
    });
}

module.exports = { runRestoreFromSqlite };
