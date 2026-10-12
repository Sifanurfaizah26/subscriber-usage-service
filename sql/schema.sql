-- ========================================================
-- Schema Definition and Seed Data
-- Compatible with PostgreSQL, MySQL, and SQLite
-- ========================================================

-- 1. Create Subscribers Table
CREATE TABLE IF NOT EXISTS subscribers (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    activation_date DATE NOT NULL
);

-- 2. Create Usage Records Table
CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- or SERIAL in Postgres
    subscriberId VARCHAR(10) NOT NULL,
    callMinutes REAL NOT NULL,
    smsCount INTEGER NOT NULL,
    dataUsageMB REAL NOT NULL,
    timestamp DATETIME NOT NULL,
    FOREIGN KEY (subscriberId) REFERENCES subscribers(id)
);

-- 3. Populate Initial Subscribers Data
INSERT INTO subscribers (id, name, plan, activation_date) VALUES
    ('SUB01', 'Amir', 'Basic',   '2023-01-12'),
    ('SUB02', 'Sari', 'Premium', '2022-05-03'),
    ('SUB03', 'Budi', 'Basic',   '2024-09-20'),
    ('SUB04', 'Dewi', 'Family',  '2021-02-15'),
    ('SUB05', 'Rian', 'Premium', '2023-08-08'),
    ('SUB06', 'Nia',  'Basic',   '2024-11-30');

-- 4. Populate Initial Usage Records Data
INSERT INTO usage_records (subscriberId, callMinutes, smsCount, dataUsageMB, timestamp) VALUES
    ('SUB01', 40,  10, 1500, '2025-08-01 08:00:00'),
    ('SUB01', 35,  8,  1200, '2025-08-01 12:00:00'),
    ('SUB02', 90,  20, 6000, '2025-08-01 08:00:00'),
    ('SUB02', 85,  18, 5800, '2025-08-01 12:00:00'),
    ('SUB03', 20,  5,  500,  '2025-08-01 08:00:00'),
    ('SUB04', 150, 30, 9000, '2025-08-01 08:00:00'),
    ('SUB05', 70,  15, 5000, '2025-08-01 08:00:00'),
    ('SUB06', 25,  6,  700,  '2025-08-01 08:00:00');
