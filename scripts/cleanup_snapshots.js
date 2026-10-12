#!/usr/bin/env node

/**
 * Snapshot Cleanup Script
 * Removes CSV snapshots in the snapshots/ directory that are older than 30 days.
 *
 * Usage:
 *   node scripts/cleanup_snapshots.js
 *   node scripts/cleanup_snapshots.js --dry-run
 *   node scripts/cleanup_snapshots.js --days=14
 *   node scripts/cleanup_snapshots.js --create-mock-old
 */

const fs = require('fs');
const path = require('path');

const SNAPSHOT_DIR = path.resolve(__dirname, '../snapshots');
const DEFAULT_RETENTION_DAYS = 30;

// Parse CLI flags
const isDryRun = process.argv.includes('--dry-run');
const createMockFlag = process.argv.includes('--create-mock-old');
const daysArg = process.argv.find(arg => arg.startsWith('--days='));
const retentionDays = daysArg ? parseFloat(daysArg.split('=')[1]) : DEFAULT_RETENTION_DAYS;

/**
 * Helper to extract creation timestamp of snapshot
 * 1. Tries to extract YYYYMMDD_HHmmss from filename
 * 2. Falls back to file modification time (mtime)
 */
function getFileTimestamp(filename, filepath) {
  const match = filename.match(/usage_snapshot_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})_WIB/i);
  if (match) {
    const [_, year, month, day, hours, minutes, seconds] = match;
    // Construct Date object (WIB = UTC+7)
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
    const parsed = new Date(isoString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Fallback to filesystem mtime
  const stats = fs.statSync(filepath);
  return stats.mtime;
}

/**
 * Create a mock old snapshot for demonstration/testing
 */
function createMockOldSnapshot() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  // 45 days ago mock timestamp
  const oldDate = new Date(Date.now() - (45 * 24 * 60 * 60 * 1000));
  const year = oldDate.getFullYear();
  const month = String(oldDate.getMonth() + 1).padStart(2, '0');
  const day = String(oldDate.getDate()).padStart(2, '0');
  const mockFilename = `usage_snapshot_${year}${month}${day}_080000_WIB.csv`;
  const mockPath = path.join(SNAPSHOT_DIR, mockFilename);

  const mockContent = 'id,subscriberId,callMinutes,smsCount,dataUsageMB,timestamp\n1,SUB01,40,10,1500,2025-08-01T08:00:00.000Z\n';
  fs.writeFileSync(mockPath, mockContent, 'utf8');

  // Set file mtime to 45 days ago as well
  const oldTimeSec = oldDate.getTime() / 1000;
  fs.utimesSync(mockPath, oldTimeSec, oldTimeSec);

  console.log(`[Mock Helper] Created 45-day-old mock snapshot for testing: ${mockFilename}`);
}

/**
 * Main Cleanup Logic
 */
function cleanupSnapshots() {
  console.log(`===================================================`);
  console.log(` 🧹 Snapshot Cleanup Script Initialized`);
  console.log(` 📁 Directory:       ${SNAPSHOT_DIR}`);
  console.log(` ⏳ Retention Rule:  Delete files older than ${retentionDays} days`);
  console.log(` 🛡️  Mode:            ${isDryRun ? 'DRY-RUN (No files will be deleted)' : 'LIVE DELETE'}`);
  console.log(`===================================================`);

  if (!fs.existsSync(SNAPSHOT_DIR)) {
    console.log(`Directory ${SNAPSHOT_DIR} does not exist. Nothing to clean.`);
    return;
  }

  const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.csv'));
  if (files.length === 0) {
    console.log(`No CSV snapshots found in ${SNAPSHOT_DIR}.`);
    return;
  }

  const now = new Date();
  let deletedCount = 0;
  let keptCount = 0;

  files.forEach(file => {
    const filepath = path.join(SNAPSHOT_DIR, file);
    try {
      const fileDate = getFileTimestamp(file, filepath);
      const diffMs = now.getTime() - fileDate.getTime();
      const ageDays = (diffMs / (1000 * 60 * 60 * 24)).toFixed(1);

      if (ageDays > retentionDays) {
        if (isDryRun) {
          console.log(` [WOULD DELETE] ${file} (Age: ${ageDays} days old)`);
        } else {
          fs.unlinkSync(filepath);
          console.log(` [DELETED]      ${file} (Age: ${ageDays} days old)`);
        }
        deletedCount++;
      } else {
        console.log(` [KEEPING]      ${file} (Age: ${ageDays} days old)`);
        keptCount++;
      }
    } catch (err) {
      console.error(` [ERROR] Could not process ${file}:`, err.message);
    }
  });

  console.log(`---------------------------------------------------`);
  console.log(` Summary:`);
  console.log(`   - Kept:    ${keptCount} file(s) within the ${retentionDays}-day retention`);
  console.log(`   - Cleaned: ${deletedCount} file(s) ${isDryRun ? 'eligible for deletion' : 'deleted'}`);
  console.log(`===================================================`);
}

if (require.main === module) {
  if (createMockFlag) {
    createMockOldSnapshot();
  }
  cleanupSnapshots();
}

module.exports = { cleanupSnapshots, getFileTimestamp };
