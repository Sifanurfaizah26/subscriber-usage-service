#!/usr/bin/env node

/**
 * SQL Execution & Verification Script
 * Uses Node.js built-in SQLite engine to execute schema and all Q3 queries.
 * Outputs formatted console tables for crystal-clear verification.
 */

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

function printBanner(title) {
  console.log('\n' + '='.repeat(60));
  console.log(` 📌 ${title}`);
  console.log('='.repeat(60));
}

function run() {
  const db = new DatabaseSync(':memory:');

  printBanner('Setting Up In-Memory Database & Seeding Test Data');
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  db.exec(schemaSql);
  console.log('✅ Tables created and initial seed rows inserted successfully.\n');

  // Preview initial subscribers
  console.log('--- Initial Subscribers Reference Table ---');
  console.table(db.prepare('SELECT * FROM subscribers').all());

  // Preview initial usage
  console.log('--- Initial Usage Records Table ---');
  console.table(db.prepare('SELECT * FROM usage_records').all());

  // -------------------------------------------------------------------------
  printBanner('Q3 - Task 1: Insert new subscriber "Fajar", Basic, 2024-01-24');
  // -------------------------------------------------------------------------
  const q1Sql = `
    INSERT INTO subscribers (id, name, plan, activation_date)
    VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');
  `;
  db.exec(q1Sql);
  console.log('Query:');
  console.log(q1Sql.trim());
  console.log('\nVerification (Subscribers table after insert):');
  console.table(db.prepare("SELECT * FROM subscribers WHERE id = 'SUB07'").all());

  // -------------------------------------------------------------------------
  printBanner('Q3 - Task 2: Update Fajar\'s plan to Premium');
  // -------------------------------------------------------------------------
  const q2Sql = `
    UPDATE subscribers
    SET plan = 'Premium'
    WHERE name = 'Fajar';
  `;
  db.exec(q2Sql);
  console.log('Query:');
  console.log(q2Sql.trim());
  console.log('\nVerification (Fajar\'s row after update):');
  console.table(db.prepare("SELECT * FROM subscribers WHERE name = 'Fajar'").all());

  // -------------------------------------------------------------------------
  printBanner('Q3 - Task 3: Total data usage for all Premium-plan subscribers');
  // -------------------------------------------------------------------------
  const q3Sql = `
    SELECT 
        SUM(u.dataUsageMB) AS total_data_usage_mb
    FROM usage_records u
    JOIN subscribers s ON u.subscriberId = s.id
    WHERE s.plan = 'Premium';
  `;
  console.log('Query:');
  console.log(q3Sql.trim());
  console.log('\nResult:');
  console.table(db.prepare(q3Sql).all());

  // Breakdown detail for clarity
  console.log('Breakdown by subscriber:');
  console.table(db.prepare(`
    SELECT s.id, s.name, s.plan, SUM(u.dataUsageMB) as subscriberTotalMB
    FROM subscribers s
    LEFT JOIN usage_records u ON s.id = u.subscriberId
    WHERE s.plan = 'Premium'
    GROUP BY s.id, s.name, s.plan
  `).all());

  // -------------------------------------------------------------------------
  printBanner('Q3 - Task 4: Top 3 subscribers by total data usage');
  // -------------------------------------------------------------------------
  const q4Sql = `
    SELECT 
        s.id AS subscriber_id,
        s.name,
        s.plan,
        SUM(u.dataUsageMB) AS total_data_usage_mb
    FROM subscribers s
    JOIN usage_records u ON s.id = u.subscriberId
    GROUP BY s.id, s.name, s.plan
    ORDER BY total_data_usage_mb DESC
    LIMIT 3;
  `;
  console.log('Query:');
  console.log(q4Sql.trim());
  console.log('\nResult:');
  console.table(db.prepare(q4Sql).all());

  // -------------------------------------------------------------------------
  printBanner('Q3 - Task 5: Subquery for subscribers with avg call minutes <= 30');
  // -------------------------------------------------------------------------
  const q5Sql = `
    SELECT 
        id,
        name,
        plan,
        activation_date
    FROM subscribers
    WHERE id IN (
        SELECT subscriberId
        FROM usage_records
        GROUP BY subscriberId
        HAVING AVG(callMinutes) <= 30
    );
  `;
  console.log('Query:');
  console.log(q5Sql.trim());
  console.log('\nResult:');
  console.table(db.prepare(q5Sql).all());

  console.log('Call Minutes Verification Table across all subscribers:');
  console.table(db.prepare(`
    SELECT 
      subscriberId,
      COUNT(*) AS snapshot_count,
      ROUND(AVG(callMinutes), 2) AS avg_call_minutes,
      CASE WHEN AVG(callMinutes) <= 30 THEN 'MATCH (<= 30)' ELSE 'EXCLUDED (> 30)' END AS status
    FROM usage_records
    GROUP BY subscriberId
  `).all());

  console.log('\n===================================================');
  console.log(' ✅ All Q3 SQL Queries Executed & Verified Successfully!');
  console.log('===================================================\n');
}

if (require.main === module) {
  run();
}
