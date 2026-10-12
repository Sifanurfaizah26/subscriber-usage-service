#!/usr/bin/env node

/**
 * Q4 Bug Demonstration & Verification Script
 * This script runs both the original buggy code and the corrected version
 * across various test cases to definitively show why it broke and how it is fixed.
 */

console.log('===================================================');
console.log(' 🐛 Q4: Troubleshoot & Explain Demonstration');
console.log('===================================================\n');

// 1. The Original Buggy Function
function buggyGetTotalUsageMB(records) {
  return records.reduce((total, record) => {
    total += record.dataUsageMB;
  });
}

// 2. The Fixed Function (Idiomatic, Safe, and Robust)
function fixedGetTotalUsageMB(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return 0;
  }
  return records.reduce((total, record) => {
    const usage = (record && typeof record.dataUsageMB === 'number') ? record.dataUsageMB : 0;
    return total + usage;
  }, 0);
}

// 3. One-liner clean ES6 version:
const cleanGetTotalUsageMB = (records) =>
  (records || []).reduce((acc, curr) => acc + (curr.dataUsageMB || 0), 0);

// Test Data
const sampleRecords = [
  { subscriberId: 'SUB01', dataUsageMB: 1500 },
  { subscriberId: 'SUB01', dataUsageMB: 1200 },
  { subscriberId: 'SUB02', dataUsageMB: 6000 }
];

console.log('Test Dataset:', JSON.stringify(sampleRecords, null, 2));

console.log('\n--- 1. Testing Original Buggy Implementation ---');
try {
  const buggyResult = buggyGetTotalUsageMB(sampleRecords);
  console.log(`Result with 3 records: ${buggyResult} (Type: ${typeof buggyResult})`);
  console.log('❌ BUG EXPLANATION: Result is undefined instead of 8700!');
} catch (e) {
  console.error('Buggy threw error:', e.message);
}

console.log('\n--- 2. Testing Buggy with Empty Array ---');
try {
  const emptyResult = buggyGetTotalUsageMB([]);
  console.log(`Result with empty array: ${emptyResult}`);
} catch (e) {
  console.log(`❌ RUNTIME CRASH: ${e.name} - ${e.message}`);
}

console.log('\n--- 3. Testing Fixed Implementation ---');
const fixedResult = fixedGetTotalUsageMB(sampleRecords);
console.log(`Result with 3 records: ${fixedResult} MB (Expected: 8700 MB)`);
console.log(`Matches expected? ${fixedResult === 8700 ? '✅ YES' : '❌ NO'}`);

const fixedEmptyResult = fixedGetTotalUsageMB([]);
console.log(`Result with empty array: ${fixedEmptyResult} MB (Expected: 0 MB)`);
console.log(`Matches expected? ${fixedEmptyResult === 0 ? '✅ YES' : '❌ NO'}`);

const singleRecordResult = fixedGetTotalUsageMB([{ subscriberId: 'SUB03', dataUsageMB: 500 }]);
console.log(`Result with 1 record: ${singleRecordResult} MB (Expected: 500 MB)`);
console.log(`Matches expected? ${singleRecordResult === 500 ? '✅ YES' : '❌ NO'}`);

console.log('\n===================================================');
console.log(' ✅ Q4 Demonstration & Verification Complete!');
console.log('===================================================\n');
