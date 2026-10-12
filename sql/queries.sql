-- ========================================================
-- Q3: Subscriber & Usage SQL Queries
-- ========================================================

-- --------------------------------------------------------
-- Task 1: Insert a new subscriber named Fajar, Basic plan,
--         activated 24 January 2024.
-- --------------------------------------------------------
-- Explanation:
-- We insert a new row into the `subscribers` table. Following the
-- ID naming pattern SUB01-SUB06, we assign 'SUB07'. Dates are
-- formatted in standard ISO 8601 'YYYY-MM-DD' ('2024-01-24').
INSERT INTO subscribers (id, name, plan, activation_date)
VALUES ('SUB07', 'Fajar', 'Basic', '2024-01-24');


-- --------------------------------------------------------
-- Task 2: Update Fajar's plan to Premium.
-- --------------------------------------------------------
-- Explanation:
-- We update the `plan` column of the subscriber where name is 'Fajar'.
UPDATE subscribers
SET plan = 'Premium'
WHERE name = 'Fajar';


-- --------------------------------------------------------
-- Task 3: Calculate the total data usage (sum of dataUsageMB
--         across all snapshots) for all Premium-plan subscribers.
-- --------------------------------------------------------
-- Explanation:
-- We join `usage_records` with `subscribers` on subscriberId,
-- filter by `plan = 'Premium'`, and aggregate the total using SUM().
-- Premium subscribers are Sari (SUB02: 6000 + 5800 = 11800 MB),
-- Rian (SUB05: 5000 MB), and Fajar (SUB07: 0 MB).
-- Expected Result: 16,800 MB.
SELECT 
    SUM(u.dataUsageMB) AS total_data_usage_mb
FROM usage_records u
JOIN subscribers s ON u.subscriberId = s.id
WHERE s.plan = 'Premium';


-- --------------------------------------------------------
-- Task 4: Sort and display the top 3 subscribers by total data
--         usage across all snapshots.
-- --------------------------------------------------------
-- Explanation:
-- We group usage by subscriber, calculate the SUM(dataUsageMB) for each,
-- sort in descending order (highest first), and limit to the top 3.
-- Expected Result:
--   1. SUB02 (Sari):  11,800 MB
--   2. SUB04 (Dewi):   9,000 MB
--   3. SUB05 (Rian):   5,000 MB
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


-- --------------------------------------------------------
-- Task 5: Write a subquery to find subscribers whose average call
--         minutes per snapshot is less than or equal to 30.
-- --------------------------------------------------------
-- Explanation:
-- The inner subquery groups `usage_records` by subscriberId and filters
-- groups where the average call minutes <= 30 using the HAVING clause.
-- The outer query then retrieves subscriber details matching those IDs.
-- Calculation:
--   SUB01: (40 + 35) / 2 = 37.5 min (> 30, excluded)
--   SUB02: (90 + 85) / 2 = 87.5 min (> 30, excluded)
--   SUB03: 20 / 1        = 20.0 min (<= 30, MATCH)
--   SUB04: 150 / 1       = 150.0 min (> 30, excluded)
--   SUB05: 70 / 1        = 70.0 min (> 30, excluded)
--   SUB06: 25 / 1        = 25.0 min (<= 30, MATCH)
-- Expected Result:
--   SUB03 (Budi) and SUB06 (Nia)
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
