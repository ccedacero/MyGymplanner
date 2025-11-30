#!/usr/bin/env node

/**
 * Backup script for SQLite database
 *
 * Usage: node server/db/backup-database.js
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'mygymplanner.db');
const BACKUP_DIR = path.join(__dirname, 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const BACKUP_PATH = path.join(BACKUP_DIR, `mygymplanner-${timestamp}.db`);

console.log('🔄 Starting database backup...\n');

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Created backups directory\n');
}

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ Database file not found at:', DB_PATH);
  process.exit(1);
}

try {
  // Copy database file
  fs.copyFileSync(DB_PATH, BACKUP_PATH);

  const stats = fs.statSync(BACKUP_PATH);
  const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log('✅ Backup completed successfully!');
  console.log('='.repeat(50));
  console.log(`📍 Backup location: ${BACKUP_PATH}`);
  console.log(`💾 Size: ${sizeInMB} MB`);
  console.log(`🕐 Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(50));

  // Clean up old backups (keep last 10)
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('mygymplanner-') && file.endsWith('.db'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > 10) {
    console.log('\n🧹 Cleaning up old backups...');
    const toDelete = backups.slice(10);
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
      console.log(`   🗑️  Deleted: ${backup.name}`);
    });
    console.log(`\n✅ Kept ${backups.length - toDelete.length} most recent backups`);
  }

} catch (error) {
  console.error('❌ Backup failed:', error.message);
  process.exit(1);
}
