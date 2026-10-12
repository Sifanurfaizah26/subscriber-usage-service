# Subscriber Usage Operations & Data Platform

Welcome to the **Subscriber Usage Operations** project! This repository contains the complete implementation for the Technical Test, covering:
- **Q1: Subscriber Usage REST API** (with an interactive dashboard)
- **Q2: Automated Usage Snapshots & 30-Day Cleanup Scripts**
- **Q3: Subscriber & Usage SQL Queries & Verification**
- **Q4: Code Troubleshooting & Root Cause Analysis for JavaScript Reducer**

---

## ⚡ Quick Start (Get it running in under 60 seconds)

You only need **Node.js** (v18 or newer recommended, tested on v24). No external database installation (like PostgreSQL or MySQL) is required because an in-memory database and SQLite are built right in.

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Application & Web Dashboard
```bash
npm start
```
Once started, open your favorite browser and visit:
👉 **[http://localhost:3000](http://localhost:3000)** (or [http://127.0.0.1:3000](http://127.0.0.1:3000))

Here you can:
- View live subscriber usage statistics and recent activity
- Record new usage records via a friendly visual form
- Download usage snapshots as CSV files with a single click
- View and test SQL solutions interactively
- Try out the Q4 bug and fix demonstration right in your browser

---

## 🧭 Project Roadmap & Available Commands

Everything can be tested directly from the command line with simple npm commands:

| Command | What it does | Question |
| :--- | :--- | :--- |
| `npm start` | Launches the REST API server and web dashboard | **Q1** |
| `npm test` | Runs the automated API test suite (8 tests) | **Q1** |
| `npm run snapshot` | Takes an immediate CSV snapshot of current usage | **Q2** |
| `npm run cron` | Starts the scheduler (08:00, 12:00, 15:00 WIB) | **Q2** |
| `npm run cleanup` | Cleans up snapshot files older than 30 days | **Q2** |
| `npm run sql` | Runs an in-memory SQLite runner testing all 5 SQL tasks | **Q3** |
| `npm run verify:q4`| Runs the bug vs fixed JavaScript reducer verification script | **Q4** |

---

## 📡 Q1: Subscriber Usage API

### What this solves
Telecom networks need a reliable way to capture and look up how much data, call time, and SMS messages each customer uses. This service provides lightweight, fast REST endpoints backed by clean in-memory storage, pre-seeded with reference data matching the test specification.

### Data Model
Each usage record captures:
- `subscriberId` *(string, required)*: Identifier of the subscriber (e.g., `"SUB01"`).
- `callMinutes` *(number, required)*: Minutes of voice calls (must be ≥ 0).
- `smsCount` *(integer, required)*: Number of SMS sent (must be ≥ 0).
- `dataUsageMB` *(number, required)*: Mobile data consumed in megabytes (must be ≥ 0).
- `timestamp` *(ISO 8601 string, optional)*: When the usage was logged (defaults to current time).

---

### API Endpoints Reference

#### 1. Record Usage
- **Method & Path:** `POST /api/usage`
- **Purpose:** Records a usage snapshot for a subscriber.
- **Request Body (JSON):**
  ```json
  {
    "subscriberId": "SUB01",
    "callMinutes": 45,
    "smsCount": 10,
    "dataUsageMB": 1500
  }
  ```
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Subscriber usage recorded successfully.",
    "data": {
      "id": 9,
      "subscriberId": "SUB01",
      "callMinutes": 45,
      "smsCount": 10,
      "dataUsageMB": 1500,
      "timestamp": "2026-10-12T05:10:00.000Z"
    }
  }
  ```
- **Error Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Field \"callMinutes\" must be a non-negative number."
  }
  ```

#### 2. Retrieve All Usage Records
- **Method & Path:** `GET /api/usage`
- **Optional Query Parameters:**
  - `?subscriberId=SUB01`: Filter results by a specific subscriber ID
  - `?limit=10`: Return only the latest N records
  - `?sortBy=dataUsageMB&order=desc`: Custom sorting
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "id": 1,
        "subscriberId": "SUB01",
        "callMinutes": 40,
        "smsCount": 10,
        "dataUsageMB": 1500,
        "timestamp": "2025-08-01T08:00:00.000Z"
      }
    ]
  }
  ```

#### 3. Retrieve Subscriber Summary & History
- **Method & Path:** `GET /api/usage/:subscriberId`
- **Purpose:** Retrieves a subscriber's profile, full usage history, and computed totals (total call minutes, SMS, and data usage).
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "subscriber": {
        "id": "SUB02",
        "name": "Sari",
        "plan": "Premium",
        "activationDate": "2022-05-03"
      },
      "recordCount": 2,
      "totalCallMinutes": 175,
      "totalSmsCount": 38,
      "totalDataUsageMB": 11800,
      "avgCallMinutesPerSnapshot": 87.5,
      "records": [ ... ]
    }
  }
  ```

#### 4. System Health Check
- **Method & Path:** `GET /api/health`
- **Success Response (200 OK):**
  ```json
  {
    "status": "online",
    "service": "Subscriber Usage API",
    "timestamp": "2026-10-12T05:10:00.000Z"
  }
  ```

---

## ⏰ Q2: Usage Snapshot Automation

In operations, reports and analytics teams frequently need periodic exports saved to files for auditing, reporting, or data warehouse ingestion.

### 1. Cron Schedule Configuration
The snapshot task is scheduled to run **3 times a day**:
- **08:00 WIB** (Western Indonesia Time / UTC+7)
- **12:00 WIB** (Noon peak)
- **15:00 WIB** (Afternoon review)

#### Crontab Expression
```cron
0 8,12,15 * * *
```

**Understanding each field:**
```text
  0        8,12,15        *            *           *
  │           │           │            │           │
Minute      Hours     Day of month   Month    Day of week
(at 00)   (8, 12, 15)  (every day)  (every)   (every day)
```

#### Timezone Considerations (WIB vs UTC)
- **If your server is in WIB (Asia/Jakarta):**
  ```bash
  0 8,12,15 * * * /usr/bin/node /path/to/Huawei/scripts/take_snapshot.js
  ```
- **If your server is configured in standard UTC (common in cloud servers like AWS or GCP):**
  Since WIB is **UTC + 7 hours**:
  - 08:00 WIB = 01:00 UTC
  - 12:00 WIB = 05:00 UTC
  - 15:00 WIB = 08:00 UTC
  ```bash
  0 1,5,8 * * * /usr/bin/node /path/to/Huawei/scripts/take_snapshot.js
  ```

#### Running the Node Cron Scheduler
To run the automated scheduler daemon locally:
```bash
npm run cron
```
*(To immediately run a test snapshot while launching the scheduler, use `node scripts/snapshot_cron.js --run-now`)*.

---

### 2. Snapshot File Naming Convention

**Format:**
```text
usage_snapshot_YYYYMMDD_HHmmss_WIB.csv
```

**Real Examples:**
- `usage_snapshot_20261012_080000_WIB.csv`
- `usage_snapshot_20261012_120000_WIB.csv`
- `usage_snapshot_20261012_150000_WIB.csv`

#### Why this naming convention is chosen:
1. **Natural chronological sorting:** Because date and time follow `YYYYMMDD_HHmmss`, file managers (Windows Explorer, macOS Finder, Linux `ls`) sort files in exact chronological order without extra flags.
2. **Clear identification:** The prefix `usage_snapshot_` immediately communicates what data is inside.
3. **Unambiguous timezone tag (`_WIB`):** In telecommunications and financial billing, logs from different timezones often clash. Explicitly labelling `_WIB` prevents operators from confusing UTC with local Jakarta time.

---

### 3. Cleanup Script (30-Day Retention Policy)

To avoid consuming disk space indefinitely, the script `scripts/cleanup_snapshots.js` automatically looks for CSV files in `snapshots/` and removes any that are older than **30 days**.

#### How to run:
```bash
# Preview what would be deleted without touching any files:
node scripts/cleanup_snapshots.js --dry-run

# Run the cleanup:
node scripts/cleanup_snapshots.js

# Test with a generated mock 45-day-old file:
node scripts/cleanup_snapshots.js --create-mock-old
```

#### Safe features included:
- **Dual timestamp check:** Inspects the date embedded in the filename (`YYYYMMDD`), and falls back to filesystem metadata (`mtime`) if needed.
- **Dry-run mode:** Operators can inspect what will be deleted safely beforehand.
- **Clear terminal logs:** Prints exact days old and whether a file was kept or removed.

---

## ⚡ Q3: Subscriber & Usage SQL

All SQL queries were written and verified against the reference data. You can run all 5 queries and inspect formatted tables by running:
```bash
npm run sql
```

Below are the exact SQL answers with human-friendly explanations:

### 1. Insert a new subscriber named Fajar, Basic plan, activated 24 January 2024.
```sql
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');
```
* **Explanation:** We insert a new record into `subscribers`. Following the existing sequence `SUB01` through `SUB06`, we assign ID `'SUB07'`. The date is formatted in standard ISO-8601 (`YYYY-MM-DD`).

---

### 2. Update Fajar's plan to Premium.
```sql
UPDATE subscribers
SET plan = 'Premium'
WHERE name = 'Fajar';
```
* **Explanation:** Targets the subscriber with `name = 'Fajar'` and changes their `plan` value to `'Premium'`.

---

### 3. Calculate total data usage for all Premium-plan subscribers across all snapshots.
```sql
SELECT 
    SUM(u.dataUsageMB) AS total_data_usage_mb
FROM usage_records u
JOIN subscribers s ON u.subscriberId = s.id
WHERE s.plan = 'Premium';
```
* **Explanation:** Joins usage records with subscriber data on subscriber ID, filters by `s.plan = 'Premium'`, and calculates the sum of all `dataUsageMB` rows.
* **Result:** **`16,800 MB`**
  - Sari (`SUB02`): 6,000 + 5,800 = 11,800 MB
  - Rian (`SUB05`): 5,000 MB
  - Fajar (`SUB07`): No usage records logged yet (0 MB)
  - Total = 11,800 + 5,000 = **16,800 MB**

---

### 4. Sort and display the top 3 subscribers by total data usage across all snapshots.
```sql
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
```
* **Explanation:** Groups usage records by subscriber, sums up each person's data usage, sorts from highest to lowest with `ORDER BY ... DESC`, and takes the top 3 using `LIMIT 3`.
* **Result Table:**
  1. **SUB02 (Sari)** — Premium: **11,800 MB**
  2. **SUB04 (Dewi)** — Family: **9,000 MB**
  3. **SUB05 (Rian)** — Premium: **5,000 MB**

---

### 5. Write a subquery to find subscribers whose average call minutes per snapshot is less than or equal to 30.
```sql
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
```
* **Explanation:**
  - The inner subquery groups `usage_records` by `subscriberId` and uses `HAVING AVG(callMinutes) <= 30` to select only the IDs that meet the criteria.
  - The outer query then returns subscriber details matching those IDs.
* **Why this result?**
  - **SUB01 (Amir):** (40 + 35) / 2 = 37.5 min *(Excluded: > 30)*
  - **SUB02 (Sari):** (90 + 85) / 2 = 87.5 min *(Excluded: > 30)*
  - **SUB03 (Budi):** 20 / 1 = 20.0 min *(Included: ≤ 30)* ✅
  - **SUB04 (Dewi):** 150 / 1 = 150.0 min *(Excluded: > 30)*
  - **SUB05 (Rian):** 70 / 1 = 70.0 min *(Excluded: > 30)*
  - **SUB06 (Nia):** 25 / 1 = 25.0 min *(Included: ≤ 30)* ✅
* **Result:** **SUB03 (Budi)** and **SUB06 (Nia)**.

---

## 🐛 Q4: Troubleshoot & Explain

### The Original Code
```javascript
function getTotalUsageMB(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB;
  });
}
```

### 1. Root Cause Analysis (Why did it break?)

When a developer runs this function in JavaScript, two separate bugs cause it to fail:

#### Bug 1: Missing `return` in the reducer callback
In JavaScript, arrow functions with a block body `{ ... }` do **not** automatically return a value. If there is no explicit `return` keyword, the function returns `undefined`.
- On iteration 1: `total += record.dataUsageMB` happens locally, but the callback returns `undefined`.
- On iteration 2: The accumulator (`total`) is now `undefined`. Adding a number to `undefined` produces `NaN` (`undefined + 1200 = NaN`).
- The entire function eventually returns `undefined` (or `NaN`).

#### Bug 2: Missing initial accumulator value (`0`)
`Array.prototype.reduce()` was called without a second argument (the `initialValue`).
When the initial value is omitted:
- JavaScript takes the **first array item** as the starting `total`.
- In our case, the first element is an **object**: `{ subscriberId: 'SUB01', callMinutes: 40, dataUsageMB: 1500 }`.
- When doing `object += number`, JavaScript converts the object into a string (`"[object Object]1200"`).
- Furthermore, if `records` is an empty list `[]`, omitting the initial value throws an uncaught error:
  ```text
  TypeError: Reduce of empty array with no initial value
  ```

---

### 2. The Fixed Code

Here is the clean, idiomatic, and defensive version:

```javascript
function getTotalUsageMB(records) {
  // Guard clause: handle null, undefined, or non-arrays safely
  if (!Array.isArray(records)) {
    return 0;
  }

  // Supply initial accumulator 0 and explicitly return the sum
  return records.reduce((total, record) => {
    const usage = (record && typeof record.dataUsageMB === 'number') 
      ? record.dataUsageMB 
      : 0;
    return total + usage;
  }, 0);
}
```

#### Clean 1-Liner Alternative (Concise ES6):
```javascript
const getTotalUsageMB = (records = []) =>
  records.reduce((acc, r) => acc + (r?.dataUsageMB || 0), 0);
```

---

### 3. How to Prevent This Class of Bug in the Future

Bugs like this are common when writing quick scripts, but in production teams we prevent them completely using four practical safeguards:

1. **Static Analysis & Linter Rules (ESLint):**
   - Enable the rule [`array-callback-return`](https://eslint.org/docs/latest/rules/array-callback-return).
   - This rule flags any `.reduce()`, `.map()`, or `.filter()` where a callback function forgets to return a value, catching the bug in the editor before code is ever saved or committed.
2. **TypeScript:**
   - In TypeScript, specifying the return type `number` immediately triggers a compile-time error:
     `Type 'void' is not assignable to type 'number'`.
3. **Unit Tests for Edge Cases:**
   - Always include test cases for:
     - An empty list `[]` (expected `0`)
     - A single-item list `[{ dataUsageMB: 500 }]` (expected `500`)
     - Missing or malformed items
4. **Peer Code Reviews:**
   - Establish a standard checklist: when reviewing `.reduce()`, always verify that an initial value is provided and the accumulator is returned on every branch.

---

## 📂 Repository Structure

```text
Huawei/
├── package.json              # Project metadata, dependencies & npm scripts
├── README.md                 # Complete documentation & human guide (this file)
├── DOCUMENTATION.md          # Architectural and operational companion guide
├── src/
│   ├── server.js             # Express application & HTTP server setup
│   ├── store.js              # In-memory storage & seed data manager
│   ├── routes/
│   │   ├── usage.js          # REST routes for recording & retrieving usage
│   │   ├── subscribers.js    # Subscriber directory routes
│   │   └── stats.js          # Aggregated metrics & reset endpoints
│   └── public/               # Modern web dashboard frontend
│       ├── index.html        # Clean, accessible dashboard layout
│       ├── style.css         # Modern styling & responsive design
│       └── app.js            # UI controller & interactive test widgets
├── scripts/
│   ├── take_snapshot.js      # Q2: Snapshot automation (API to CSV)
│   ├── snapshot_cron.js      # Q2: Cron scheduler (08:00, 12:00, 15:00 WIB)
│   ├── cleanup_snapshots.js  # Q2: 30-day retention cleanup script
│   ├── run_sql.js            # Q3: SQLite runner for all 5 queries
│   └── verify_q4.js          # Q4: Bug vs fixed reducer verification
├── sql/
│   ├── schema.sql            # Schema definitions & seed data
│   └── queries.sql           # SQL statements for Q3 tasks 1 to 5
├── tests/
│   └── api.test.js           # Integration test suite for the REST API
└── snapshots/                # Directory where CSV snapshot files are stored
```

---

## 🏆 Summary Checklist

- [x] **Q1:** REST API built with in-memory storage, clear endpoints, and request/response validation.
- [x] **Q1 Bonus:** Interactive, responsive Web Dashboard created.
- [x] **Q2:** Cron scheduler scheduled for 08:00, 12:00, and 15:00 WIB with documented naming convention.
- [x] **Q2:** Standalone automated cleanup script enforcing 30-day retention with dry-run support.
- [x] **Q3:** All 5 SQL tasks answered, documented, and verified with live test runner.
- [x] **Q4:** Root causes identified, code fixed, and real-world prevention strategies detailed.
- [x] **Docs:** Written with human-friendly clarity, practical examples, and zero fluff.
