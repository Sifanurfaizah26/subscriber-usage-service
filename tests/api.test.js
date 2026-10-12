const assert = require('assert');
const http = require('http');
const app = require('../src/server');

let server;
let baseUrl;

function makeRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('===================================================');
  console.log(' 🧪 Running API Integration Tests');
  console.log('===================================================\n');

  // Start test server on random port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // Test 1: Healthcheck
    console.log('▶ Test 1: GET /api/health');
    const healthRes = await makeRequest('GET', '/api/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.body.status, 'online');
    console.log('  ✅ Passed: Healthcheck returned 200 OK');

    // Test 2: GET /api/usage (retrieve all)
    console.log('▶ Test 2: GET /api/usage');
    const allUsageRes = await makeRequest('GET', '/api/usage');
    assert.strictEqual(allUsageRes.status, 200);
    assert.strictEqual(allUsageRes.body.success, true);
    assert.strictEqual(allUsageRes.body.count >= 8, true);
    console.log(`  ✅ Passed: Retrieved ${allUsageRes.body.count} usage records`);

    // Test 3: POST /api/usage (record valid usage)
    console.log('▶ Test 3: POST /api/usage (Valid submission)');
    const newUsage = {
      subscriberId: 'SUB03',
      callMinutes: 45,
      smsCount: 12,
      dataUsageMB: 2048
    };
    const createRes = await makeRequest('POST', '/api/usage', newUsage);
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createRes.body.success, true);
    assert.strictEqual(createRes.body.data.subscriberId, 'SUB03');
    assert.strictEqual(createRes.body.data.dataUsageMB, 2048);
    console.log('  ✅ Passed: Successfully recorded usage with 201 Created');

    // Test 4: POST /api/usage with invalid data
    console.log('▶ Test 4: POST /api/usage (Validation failure handling)');
    const invalidUsage = { subscriberId: 'SUB01', callMinutes: -10, smsCount: 'none' };
    const invalidRes = await makeRequest('POST', '/api/usage', invalidUsage);
    assert.strictEqual(invalidRes.status, 400);
    assert.strictEqual(invalidRes.body.success, false);
    console.log(`  ✅ Passed: Caught validation error with 400 Bad Request ("${invalidRes.body.error}")`);

    // Test 5: GET /api/usage?subscriberId=SUB01 (filter)
    console.log('▶ Test 5: GET /api/usage?subscriberId=SUB01');
    const filterRes = await makeRequest('GET', '/api/usage?subscriberId=SUB01');
    assert.strictEqual(filterRes.status, 200);
    assert.strictEqual(filterRes.body.data.every(r => r.subscriberId === 'SUB01'), true);
    console.log(`  ✅ Passed: Filtered correctly, found ${filterRes.body.count} records for SUB01`);

    // Test 6: GET /api/usage/:subscriberId (summary)
    console.log('▶ Test 6: GET /api/usage/SUB02');
    const subRes = await makeRequest('GET', '/api/usage/SUB02');
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body.data.subscriber.name, 'Sari');
    assert.strictEqual(subRes.body.data.totalDataUsageMB, 11800);
    console.log('  ✅ Passed: Returned accurate subscriber summary and totalDataUsageMB');

    // Test 7: GET /api/stats/overview
    console.log('▶ Test 7: GET /api/stats/overview');
    const statsRes = await makeRequest('GET', '/api/stats/overview');
    assert.strictEqual(statsRes.status, 200);
    assert.strictEqual(statsRes.body.data.totalSubscribersRegistered, 6);
    console.log('  ✅ Passed: Retrieved system overview stats');

    // Test 8: POST /api/stats/reset
    console.log('▶ Test 8: POST /api/stats/reset');
    const resetRes = await makeRequest('POST', '/api/stats/reset');
    assert.strictEqual(resetRes.status, 200);
    assert.strictEqual(resetRes.body.success, true);
    console.log('  ✅ Passed: Reset store back to initial seed state');

    console.log('\n===================================================');
    console.log(' 🎉 All 8 API Tests Passed Successfully!');
    console.log('===================================================\n');
  } finally {
    server.close();
  }
}

if (require.main === module) {
  runTests().catch(err => {
    console.error('Test Suite Failed:', err);
    if (server) server.close();
    process.exit(1);
  });
}

module.exports = { runTests };
