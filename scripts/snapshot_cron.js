#!/usr/bin/env node

/**
 * Usage Snapshot Cron Scheduler
 * Runs 3 times a day at 08:00, 12:00, and 15:00 WIB (Asia/Jakarta timezone).
 *
 * Crontab Expression:
 *   0 8,12,15 * * *
 *
 * Field breakdown:
 *   ┌───────────── Minute (0)
 *   │ ┌─────────── Hour (8, 12, 15)
 *   │ │ ┌───────── Day of month (any: *)
 *   │ │ │ ┌─────── Month (any: *)
 *   │ │ │ │ ┌───── Day of week (any: *)
 *   0 8,12,15 * * *
 */

const cron = require('node-cron');
const { takeSnapshot } = require('./take_snapshot');

const CRON_EXPRESSION = '0 8,12,15 * * *';
const TIMEZONE = 'Asia/Jakarta'; // Western Indonesia Time (WIB / UTC+7)

console.log(`===================================================`);
console.log(` ⏰ Usage Snapshot Cron Scheduler Initialized`);
console.log(` 📅 Schedule:   Runs at 08:00, 12:00, and 15:00 WIB daily`);
console.log(` 🧭 Cron Expr:  ${CRON_EXPRESSION}`);
console.log(` 🌐 Timezone:   ${TIMEZONE} (WIB / UTC+7)`);
console.log(`===================================================`);

// Schedule the task
const task = cron.schedule(
  CRON_EXPRESSION,
  async () => {
    console.log(`\n[CRON TRIGGERED] Running scheduled snapshot at ${new Date().toISOString()}...`);
    try {
      await takeSnapshot();
      console.log(`[CRON SUCCESS] Snapshot cycle completed successfully.`);
    } catch (err) {
      console.error(`[CRON ERROR] Snapshot cycle failed:`, err.message);
    }
  },
  {
    scheduled: true,
    timezone: TIMEZONE
  }
);

// If user runs with `--run-now` flag, trigger a snapshot immediately
if (process.argv.includes('--run-now')) {
  console.log(`\n[FLAG --run-now detected] Executing immediate snapshot test...`);
  takeSnapshot().catch(err => console.error('[Error]', err));
}

console.log(`Scheduler is waiting for the next trigger point. Press Ctrl+C to exit.`);

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log(`\nStopping cron scheduler... Goodbye!`);
  task.stop();
  process.exit(0);
});
