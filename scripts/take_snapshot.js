#!/usr/bin/env node

/**
 * Usage Snapshot Automation Script
 * Retrieves the current subscriber usage data and saves it as a formatted CSV file.
 *
 * File Naming Convention:
 *   usage_snapshot_YYYYMMDD_HHmmss_WIB.csv
 *
 * Example:
 *   usage_snapshot_20261012_080000_WIB.csv
 */

const fs = require('fs');
const path = require('path');

// Target directory for snapshots
const SNAPSHOT_DIR = path.resolve(__dirname, '../snapshots');

/**
 * Generates formatted timestamp in WIB (UTC+7)
 * Returns object with formatted string and components
 */
function getWibTimestamp() {
  const now = new Date();
  // Adjust to UTC+7 (Western Indonesia Time / WIB)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibDate = new Date(utc + (7 * 3600000));

  const year = wibDate.getFullYear();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const day = String(wibDate.getDate()).padStart(2, '0');
  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');
  const seconds = String(wibDate.getSeconds()).padStart(2, '0');

  const fileTag = `${year}${month}${day}_${hours}${minutes}${seconds}_WIB`;
  const readable = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} WIB`;

  return { fileTag, readable, year, month, day, hours, minutes, seconds };
}

/**
 * Fetch records from API or fallback to internal store
 */
async function fetchUsageData() {
  const apiUrl = process.env.API_URL || 'http://localhost:3000/api/usage';
  try {
    const response = await fetch(apiUrl, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      const json = await response.json();
      console.log(`[Snapshot] Successfully retrieved ${json.data.length} records via HTTP API (${apiUrl})`);
      return json.data;
    }
  } catch (err) {
    // API server might not be running in standalone/test mode; fallback to store directly
    console.log(`[Snapshot] HTTP API not reachable (${err.message}). Using local in-memory store fallback.`);
  }

  const store = require('../src/store');
  return store.getAllUsageRecords();
}

/**
 * Escape CSV cell value
 */
function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert array of usage records into CSV text
 */
function convertToCsv(records) {
  const headers = ['id', 'subscriberId', 'callMinutes', 'smsCount', 'dataUsageMB', 'timestamp'];
  const rows = [headers.join(',')];

  for (const r of records) {
    const row = [
      escapeCsv(r.id),
      escapeCsv(r.subscriberId),
      escapeCsv(r.callMinutes),
      escapeCsv(r.smsCount),
      escapeCsv(r.dataUsageMB),
      escapeCsv(r.timestamp)
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Main execution
 */
async function takeSnapshot() {
  if (!fs.existsSync(SNAPSHOT_DIR)) {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }

  const time = getWibTimestamp();
  const filename = `usage_snapshot_${time.fileTag}.csv`;
  const filepath = path.join(SNAPSHOT_DIR, filename);

  const records = await fetchUsageData();
  const csvContent = convertToCsv(records);

  fs.writeFileSync(filepath, csvContent, 'utf8');

  console.log(`===================================================`);
  console.log(` ✅ Usage Snapshot Created Successfully!`);
  console.log(` 🕒 Time (WIB):  ${time.readable}`);
  console.log(` 📄 File:        ${filename}`);
  console.log(` 📁 Path:        ${filepath}`);
  console.log(` 📊 Records:     ${records.length} usage rows`);
  console.log(` 💾 Size:        ${Buffer.byteLength(csvContent, 'utf8')} bytes`);
  console.log(`===================================================`);

  return { filepath, filename, recordCount: records.length };
}

if (require.main === module) {
  takeSnapshot().catch(err => {
    console.error(`[Snapshot Error] Failed to create snapshot:`, err);
    process.exit(1);
  });
}

module.exports = { takeSnapshot, getWibTimestamp, SNAPSHOT_DIR };
