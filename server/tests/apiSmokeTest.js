/**
 * Automated API Smoke Test Suite
 * Tests Auth, CRUD, Analytics, Error Handling, and RBAC
 */
const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

const runTests = async () => {
  console.log('🧪 Starting API Smoke Tests against:', BASE_URL);
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'healthy', 'GET /health returns 200 OK');

    // 2. Auth: Register a new test user
    const uniqueEmail = `test_${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automation Tester',
        email: uniqueEmail,
        password: 'Password@123',
      }),
    });
    const regJson = await regRes.json();
    assert(regRes.status === 201 && regJson.token, 'POST /auth/register creates user and returns JWT');
    const userToken = regJson.token;

    // 3. Auth: Login with valid credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'Password@123',
      }),
    });
    const loginJson = await loginRes.json();
    assert(loginRes.status === 200 && loginJson.token, 'POST /auth/login returns 200 and token');

    // 4. Error Scenario: Login with invalid password
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uniqueEmail,
        password: 'WrongPassword!',
      }),
    });
    assert(badLoginRes.status === 401, 'POST /auth/login rejects invalid credentials with 401 Unauthorized');

    // 5. CRUD: Create an expense
    const createRes = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        title: 'Smoke Test Lunch',
        amount: 350,
        type: 'EXPENSE',
        category: 'Food & Dining',
        paymentMethod: 'UPI',
        date: new Date().toISOString(),
      }),
    });
    const createJson = await createRes.json();
    assert(createRes.status === 201 && createJson.data._id, 'POST /expenses creates expense with 201');
    const createdId = createJson.data._id;

    // 6. CRUD: Get expenses with filter
    const getRes = await fetch(`${BASE_URL}/expenses?category=Food%20%26%20Dining`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const getJson = await getRes.json();
    assert(getRes.status === 200 && Array.isArray(getJson.data), 'GET /expenses returns list with 200 OK');

    // 7. Analytics: Get expense summary stats
    const statsRes = await fetch(`${BASE_URL}/expenses/stats/summary`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const statsJson = await statsRes.json();
    assert(statsRes.status === 200 && statsJson.data.summary, 'GET /expenses/stats/summary returns aggregated analytics');

    // 8. RBAC Error Scenario: Normal user accessing Admin route
    const adminCheckRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(adminCheckRes.status === 403, 'GET /admin/users blocks normal user with 403 Forbidden');

    // 9. Admin Login and Access
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Admin@123',
      }),
    });
    const adminLoginJson = await adminLoginRes.json();
    if (adminLoginRes.status === 200) {
      const adminToken = adminLoginJson.token;
      const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(adminStatsRes.status === 200, 'GET /admin/stats succeeds for Admin with 200 OK');
    } else {
      console.log('  ⚠️ Skipping admin verification (seed user not yet loaded)');
    }

    // 10. CRUD: Delete test expense
    const delRes = await fetch(`${BASE_URL}/expenses/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(delRes.status === 200, 'DELETE /expenses/:id removes transaction with 200 OK');

    console.log(`\n🏁 Test Run Summary: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Smoke test crashed:', err.message);
    process.exit(1);
  }
};

runTests();
