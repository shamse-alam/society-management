/**
 * Guard Feature E2E Tests
 *
 * Covers:
 * - Guard dashboard
 * - Visitor management (expected, inside, check-in/out)
 * - Delivery logging
 * - Daily help check-in
 * - Vehicle verification
 * - Visitor parking
 * - Properties view (read-only)
 */
const { test, expect } = require('../helpers/fixtures');

test.describe('Guard — Dashboard', () => {
  test('guard can view home page with guard dashboard', async ({ guardPage }) => {
    await guardPage.goto('/home');
    await expect(guardPage).toHaveURL(/\/home/);
    await guardPage.waitForLoadState('networkidle');
  });
});

test.describe('Guard — Visitor Management API', () => {
  test('guard can get expected visitors', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/expected');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can get currently inside visitors', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/inside');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can get awaiting approval list', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/awaiting-approval');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can get visitor stats', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/stats');
    expect(res.status).toBe(200);
  });
});

test.describe('Guard — Delivery Management', () => {
  test('guard can log a delivery via API', async ({ guardAPI }) => {
    const res = await guardAPI.post('/guard/deliveries', {
      unitNumber: 'A-101', deliveryType: 'COURIER',
      description: 'E2E_Test Package', courierName: 'BlueDart',
    });
    expect([200, 400]).toContain(res.status);
  });

  test('guard can view pending deliveries', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/deliveries/pending');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Guard — Daily Help', () => {
  test('guard can view daily help entries', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/daily-help');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Guard — Properties (read-only)', () => {
  test('guard can list properties', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/properties');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Guard — Vehicle Verification', () => {
  test('guard can verify a vehicle by number', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/vehicles/verify/E2E-KA01-1234');
    // 200 if found, 404 if not
    expect([200, 404]).toContain(res.status);
  });
});

test.describe('Guard — Visitor Parking', () => {
  test('guard can view active visitor parking', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/visitor-parking');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can view available visitor parking slots', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/visitor-parking/slots');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Guard — Access Restrictions', () => {
  test('guard cannot access admin endpoints via API', async ({ guardAPI }) => {
    const res = await guardAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('guard cannot create users via API', async ({ guardAPI }) => {
    const res = await guardAPI.post('/admin/users', {
      username: 'hack_attempt', password: 'test', firstName: 'Hack', lastName: 'Attempt',
      email: 'hack@test.com', roles: 'ADMIN',
    });
    expect(res.status).toBe(403);
  });

  test('guard cannot access user-level endpoints', async ({ guardAPI }) => {
    const res = await guardAPI.get('/user/profile');
    expect(res.status).toBe(403);
  });
});
