# System Documentation & Operational Guide
## Subscriber Usage Operations & Data Platform

---

## 1. Welcome & Executive Overview

When telecom operators manage mobile networks, millions of usage events happen every hour: customers make phone calls, send text messages, and browse the internet. To bill accurately, detect abnormal network surges, or provide customer service agents with up-to-date data, systems need to:
1. Record usage snapshots quickly without slowing down transactions.
2. Provide simple ways to query a customer's usage.
3. Automatically archive and export data at regular daily intervals.
4. Keep the storage clean by trimming old archives.

This project delivers a complete, production-ready solution designed for simplicity, ease of use, and rock-solid reliability.

---

## 2. Who Is This System For?

We designed this platform with real people in mind:

| Role | How they use this platform |
| :--- | :--- |
| **Customer Support / Call Center** | Look up a customer's usage to explain a recent bill or check if they are near their data cap. |
| **Data & Analytics Teams** | Ingest the daily 08:00, 12:00, and 15:00 WIB CSV snapshots into reporting dashboards (PowerBI, Tableau). |
| **DevOps & Sysadmins** | Rely on automated retention cleanup scripts so servers never run out of disk space. |
| **Engineering Evaluators** | Verify code quality, test coverage, relational SQL queries, and bug troubleshooting in minutes. |

---

## 3. High-Level Architecture & Workflow

Here is how the pieces connect together in everyday operation:

```text
       ┌────────────────────────┐
       │     Human Users /      │
       │    Customer Support    │
       └───────────┬────────────┘
                   │  Opens Browser
                   ▼
       ┌────────────────────────┐
       │ Modern Web Dashboard   │
       │   (http://localhost:3000)
       └───────────┬────────────┘
                   │  HTTP REST Calls
                   ▼
       ┌────────────────────────┐
       │ Express REST API Server│
       │  (src/server.js)       │
       └─────┬────────────┬─────┘
             │            │
  Reads/     │            │ Writes usage
  Writes     │            │
             ▼            ▼
   ┌─────────────────────────────┐
   │ In-Memory Data Store        │
   │ (Pre-seeded with test data) │
   └─────────────────────────────┘
                 ▲
                 │ Periodic HTTP Fetch / Direct Query
                 │
   ┌─────────────┴───────────────┐
   │ Scheduled Cron Automation   │
   │ (08:00, 12:00, 15:00 WIB)   │
   └─────────────┬───────────────┘
                 │ Generates CSV
                 ▼
   ┌─────────────────────────────┐
   │ snapshots/ Directory        │
   │ usage_snapshot_..._WIB.csv  │
   └─────────────┬───────────────┘
                 │
                 │ 30-Day Retention Sweep
                 ▼
   ┌─────────────────────────────┐
   │ Automated Cleanup Script    │
   │ (scripts/cleanup_snapshots) │
   └─────────────────────────────┘
```

---

## 4. Setting Up in 2 Steps

You do not need to install complicated database servers or set up Docker containers to run this project.

### Step 1: Install Dependencies
Open your terminal inside the project directory and run:
```bash
npm install
```
This installs the required lightweight libraries (`express`, `cors`, `node-cron`).

### Step 2: Start the System
```bash
npm start
```
You will see a confirmation banner:
```text
===================================================
 🚀 Subscriber Usage Service is Running!
 🌐 Web Dashboard: http://localhost:3000 or http://127.0.0.1:3000
 📡 API Base:      http://127.0.0.1:3000/api/usage
 🩺 Health Check:  http://127.0.0.1:3000/api/health
===================================================
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. Walkthrough: The Four Technical Test Questions

### Question 1: Subscriber Usage REST API & Frontend

#### The Goal
Record subscriber usage events (`subscriberId`, `callMinutes`, `smsCount`, `dataUsageMB`) and retrieve usage records on demand.

#### How It Works
- **Storage:** Managed in memory (`src/store.js`). When initialized, it contains the test's baseline reference data (Amir, Sari, Budi, Dewi, Rian, Nia) and their initial usage records.
- **Validation:** When recording usage, the API checks that:
  - `subscriberId` is present and non-empty.
  - `callMinutes`, `smsCount`, and `dataUsageMB` are numbers ≥ 0.
  - Floating numbers are converted and validated gracefully.
- **Frontend Plus:** An intuitive visual dashboard is served directly from the same service. Users can:
  - Filter usage records in real time by typing an ID.
  - Open the "Record Usage" modal to input usage for any subscriber.
  - View aggregate usage KPIs.
  - Reset to original seed values anytime.

---

### Question 2: Usage Snapshot Automation & Cleanup

#### The Goal
1. Automatically save a snapshot of subscriber usage data as a CSV file 3 times daily (at 08:00, 12:00, and 15:00 WIB).
2. Establish a clear file naming convention.
3. Automatically delete CSV snapshots that are older than 30 days.

#### 1. Why the Schedule is Set to 08:00, 12:00, 15:00 WIB
These three time slots align with typical telecom operations in Indonesia:
- **08:00 WIB:** Morning peak start / overnight reconciliation.
- **12:00 WIB:** Mid-day peak traffic review.
- **15:00 WIB:** Afternoon operational shift change.

**Cron expression:**
```text
0 8,12,15 * * *
```
- In servers configured in **WIB (Asia/Jakarta / UTC+7)**: `0 8,12,15 * * *`
- In servers configured in standard **UTC**: `0 1,5,8 * * *`

#### 2. File Naming Convention Explained
```text
usage_snapshot_YYYYMMDD_HHmmss_WIB.csv
```
Example: `usage_snapshot_20261012_080000_WIB.csv`

**Why this matters for humans and computers alike:**
- Humans immediately know the date, time, and timezone without opening the file.
- Operating systems sort the files chronologically by default.
- Data pipelines never accidentally overwrite previous exports.

#### 3. Automated 30-Day Cleanup Script
- **Script location:** `scripts/cleanup_snapshots.js`
- **Safety check:** Includes a `--dry-run` flag so an administrator can preview what would be deleted without actually deleting anything.
- **Testing helper:** Includes `--create-mock-old` to generate a 45-day-old dummy snapshot to demonstrate the cleanup behavior safely.

---

### Question 3: Subscriber & Usage SQL Queries

All queries are documented in `sql/queries.sql` and can be tested live via `npm run sql`.

#### Summary of Results:
1. **Insert Fajar:** Added to subscribers with ID `SUB07`, plan `Basic`, activated `2024-01-24`.
2. **Update Fajar:** Updated plan to `Premium`.
3. **Total Data Usage for Premium Users:**
   - Sari (`SUB02`): 11,800 MB
   - Rian (`SUB05`): 5,000 MB
   - Fajar (`SUB07`): 0 MB
   - **Combined Total: 16,800 MB**
4. **Top 3 Subscribers by Total Data Usage:**
   - 1st: **Sari (`SUB02`)** — 11,800 MB
   - 2nd: **Dewi (`SUB04`)** — 9,000 MB
   - 3rd: **Rian (`SUB05`)** — 5,000 MB
5. **Subquery for Average Call Minutes ≤ 30:**
   - Evaluated across snapshots:
     - Budi (`SUB03`): average 20.0 minutes
     - Nia (`SUB06`): average 25.0 minutes
   - **Matching Subscribers: Budi and Nia.**

---

### Question 4: JavaScript Troubleshooting & Root Cause Analysis

Given code:
```javascript
function getTotalUsageMB(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB;
  });
}
```

#### Why it fails:
1. **The callback returns `undefined`:** Arrow functions with curly braces `{ ... }` need an explicit `return`. Without it, `total` becomes `undefined` on the second loop, producing `NaN`.
2. **Missing `0` starting value:** Without an initial value, JavaScript takes the first array item (an object!) as the start. Adding numbers to an object causes bizarre string concatenation (`"[object Object]1200"`), and calling it on an empty array crashes with a fatal runtime `TypeError`.

#### The Fix:
```javascript
function getTotalUsageMB(records) {
  if (!Array.isArray(records)) return 0;
  return records.reduce((total, record) => total + ((record && record.dataUsageMB) || 0), 0);
}
```

#### Prevention:
- Use ESLint rule `array-callback-return`.
- Use TypeScript with explicit return types (`: number`).
- Write unit tests for empty arrays `[]` and single-item arrays.

---

## 6. How to Run and Verify Each Question

| To Verify | Run this terminal command | Expected Output |
| :--- | :--- | :--- |
| **API Endpoints** | `npm test` | All 8 integration tests pass |
| **Take Snapshot** | `npm run snapshot` | CSV saved to `snapshots/` with record count & file size |
| **Run Scheduler** | `npm run cron` | Logs schedule for 08:00, 12:00, 15:00 WIB |
| **Run Cleanup** | `npm run cleanup` | Analyzes snapshot age and removes files > 30 days old |
| **SQL Queries** | `npm run sql` | Displays formatted tables for all 5 SQL tasks |
| **Q4 Reducer Fix**| `npm run verify:q4` | Shows buggy returning `undefined` and fixed returning `8700 MB` |

---

## 7. Configuration Options

You can customize the service behavior using environment variables:

- `PORT`: Set custom HTTP port (defaults to `3000`). Example: `PORT=8080 npm start`
- `API_URL`: Target URL used by the snapshot script (defaults to `http://localhost:3000/api/usage`).
- `--dry-run`: Pass to `cleanup_snapshots.js` to simulate deletion without deleting files.
- `--days=N`: Customize retention period (defaults to 30 days). Example: `node scripts/cleanup_snapshots.js --days=14`.
