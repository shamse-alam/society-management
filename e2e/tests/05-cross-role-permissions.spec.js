/**
 * Cross-Role Permission & Access Control Tests
 *
 * API-level tests verifying each role is blocked from endpoints they shouldn't access.
 * Tests the backend permission enforcement defined in permissions.yml.
 *
 * Matrix:
 * - RESIDENT: only /api/user/** and /api/notifications/**
 * - GUARD: only /api/guard/** and /api/notifications/**
 * - ACCOUNTANT: /api/accountant/**, /api/user/** (GET only), /api/notifications/**
 * - PRESIDENT: /api/accountant/**, selected /api/admin/** paths, /api/user/**, /api/notifications/**
 * - SECRETARY: /api/accountant/**, selected /api/admin/** paths, /api/user/**, /api/notifications/**
 * - TREASURER: /api/accountant/**, broader /api/admin/** financial paths, /api/user/**, /api/notifications/**
 * - COMMITTEE_MEMBER: read-only on selected /api/admin/** paths, /api/user/**, /api/notifications/**
 */
const { test, expect } = require('../helpers/fixtures');

// ── RESIDENT restrictions ─────────────────────────────────────────────
test.describe('Resident — forbidden endpoints', () => {
  test('resident cannot access admin users', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin payments', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin expenses', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/expenses');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin vendors', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/vendors');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin notices (write)', async ({ residentAPI }) => {
    const res = await residentAPI.post('/admin/notices', { title: 'Hack', content: 'Test' });
    expect(res.status).toBe(403);
  });

  test('resident cannot access guard endpoints', async ({ residentAPI }) => {
    const res = await residentAPI.get('/guard/expected');
    expect(res.status).toBe(403);
  });

  test('resident cannot access accountant endpoints', async ({ residentAPI }) => {
    const res = await residentAPI.get('/accountant/expenses');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin balance sheet', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(403);
  });

  test('resident cannot access admin society config', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });

  test('resident cannot create fund releases', async ({ residentAPI }) => {
    const res = await residentAPI.post('/admin/fund-releases', {
      fundType: 'CORPUS', amount: 100000, reason: 'Hack attempt',
    });
    expect(res.status).toBe(403);
  });
});

// ── GUARD restrictions ────────────────────────────────────────────────
test.describe('Guard — forbidden endpoints', () => {
  test('guard cannot access admin endpoints', async ({ guardAPI }) => {
    const endpoints = [
      '/admin/users', '/admin/payments', '/admin/expenses', '/admin/vendors',
      '/admin/notices', '/admin/balance-sheet', '/admin/society-config',
    ];
    for (const ep of endpoints) {
      const res = await guardAPI.get(ep);
      expect(res.status, `GET ${ep} should be 403`).toBe(403);
    }
  });

  test('guard cannot access user endpoints', async ({ guardAPI }) => {
    const res = await guardAPI.get('/user/profile');
    expect(res.status).toBe(403);
  });

  test('guard cannot access accountant endpoints', async ({ guardAPI }) => {
    const res = await guardAPI.get('/accountant/expenses');
    expect(res.status).toBe(403);
  });
});

// ── ACCOUNTANT permissions ────────────────────────────────────────────
test.describe('Accountant — allowed endpoints', () => {
  test('accountant can access accountant expenses', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('accountant can access accountant vendors', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/accountant/vendors');
    expect(res.status).toBe(200);
  });

  test('accountant can access accountant payments', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/accountant/payments');
    expect(res.status).toBe(200);
  });

  test('accountant can read user profile (GET)', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });
});

test.describe('Accountant — forbidden endpoints', () => {
  test('accountant cannot access admin user management', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('accountant cannot access admin society config', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });

  test('accountant cannot access guard endpoints', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/guard/expected');
    expect(res.status).toBe(403);
  });

  test('accountant cannot access admin properties', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });
});

// ── PRESIDENT permissions ─────────────────────────────────────────────
test.describe('President — allowed endpoints', () => {
  test('president can access accountant expenses', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('president can access admin expenses', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('president can access admin fund releases', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('president can read admin vendors', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('president can read balance sheet', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('president can access admin notices', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('president can access move requests', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  test('president can access user endpoints', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });
});

test.describe('President — forbidden endpoints', () => {
  test('president cannot manage users', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('president cannot manage admin payments', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('president cannot manage properties', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('president cannot create vendors (only GET)', async ({ presidentAPI }) => {
    const res = await presidentAPI.post('/admin/vendors', {
      name: 'HackVendor', category: 'OTHER',
    });
    expect(res.status).toBe(403);
  });

  test('president cannot access guard endpoints', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/guard/expected');
    expect(res.status).toBe(403);
  });

  test('president cannot access society config', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });
});

// ── SECRETARY permissions ─────────────────────────────────────────────
test.describe('Secretary — allowed endpoints', () => {
  test('secretary can access admin complaints', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
  });

  test('secretary can access admin notices', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('secretary can read admin visitors', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/visitors');
    expect(res.status).toBe(200);
  });

  test('secretary can access move requests', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  test('secretary can access fund releases', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });
});

test.describe('Secretary — forbidden endpoints', () => {
  test('secretary cannot manage users', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('secretary cannot manage properties', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('secretary cannot manage payments', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('secretary cannot create vendors', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.post('/admin/vendors', { name: 'HackVendor' });
    expect(res.status).toBe(403);
  });

  test('secretary cannot access society config', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });
});

// ── TREASURER permissions ─────────────────────────────────────────────
test.describe('Treasurer — allowed endpoints', () => {
  test('treasurer can access admin payments', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/payments');
    expect(res.status).toBe(200);
  });

  test('treasurer can access admin expenses', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('treasurer can access admin vendors (full)', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('treasurer can create vendor', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.post('/admin/vendors', {
      name: 'E2E_Treasurer_Vendor', category: 'SECURITY', phone: '+91-9500000001',
      active: true, vendorType: 'OTHER',
    });
    expect([200, 400]).toContain(res.status); // 400 if duplicate
  });

  test('treasurer can read balance sheet', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('treasurer can access fund releases', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('treasurer can access reports', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/reports/defaulters');
    expect(res.status).toBe(200);
  });
});

test.describe('Treasurer — forbidden endpoints', () => {
  test('treasurer cannot manage users', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('treasurer cannot manage properties', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('treasurer cannot access society config', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });

  test('treasurer cannot manage notices', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/notices');
    expect(res.status).toBe(403);
  });
});

// ── COMMITTEE_MEMBER permissions ──────────────────────────────────────
test.describe('Committee Member — allowed endpoints', () => {
  test('committee member can read balance sheet', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('committee member can read fund releases', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('committee member can read complaints', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
  });

  test('committee member can read notices', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('committee member can read move requests', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  test('committee member can read visitor logs', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/visitors');
    expect(res.status).toBe(200);
  });

  test('committee member can access user endpoints', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });
});

test.describe('Committee Member — forbidden endpoints', () => {
  test('committee member cannot write notices', async ({ committeeAPI }) => {
    const res = await committeeAPI.post('/admin/notices', { title: 'Hack', content: 'Test' });
    expect(res.status).toBe(403);
  });

  test('committee member cannot manage users', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('committee member cannot manage payments', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('committee member cannot manage expenses', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/expenses');
    expect(res.status).toBe(403);
  });

  test('committee member cannot manage vendors', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/vendors');
    expect(res.status).toBe(403);
  });

  test('committee member cannot manage properties', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('committee member cannot create fund releases', async ({ committeeAPI }) => {
    const res = await committeeAPI.post('/admin/fund-releases', {
      fundType: 'CORPUS', amount: 1000, reason: 'Hack',
    });
    expect(res.status).toBe(403);
  });

  test('committee member cannot access society config', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });

  test('committee member cannot access accountant endpoints', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/accountant/expenses');
    expect(res.status).toBe(403);
  });

  test('committee member cannot access guard endpoints', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/guard/expected');
    expect(res.status).toBe(403);
  });
});

// ── UNAUTHENTICATED restrictions ──────────────────────────────────────
test.describe('Unauthenticated — API access', () => {
  const { request } = require('../helpers/api-client');

  test('unauthenticated cannot access admin endpoints', async () => {
    const res = await request('GET', '/admin/users');
    expect(res.status).toBe(401);
  });

  test('unauthenticated cannot access user endpoints', async () => {
    const res = await request('GET', '/user/profile');
    expect(res.status).toBe(401);
  });

  test('unauthenticated cannot access guard endpoints', async () => {
    const res = await request('GET', '/guard/expected');
    expect(res.status).toBe(401);
  });

  test('unauthenticated can access public endpoints', async () => {
    const res = await request('GET', '/public/society-config');
    expect([200, 404]).toContain(res.status); // 200 or 404 if not configured
  });

  test('unauthenticated can access auth endpoints', async () => {
    const res = await request('POST', '/auth/login', { body: { username: 'admin', password: 'welcome' } });
    expect(res.status).toBe(200);
  });
});

// ── DATA ISOLATION between residents ──────────────────────────────────
test.describe('Data Isolation — Residents', () => {
  test('resident1 complaints are not visible to resident2', async ({ residentAPI, resident2API }) => {
    const { data: r1Complaints } = await residentAPI.get('/user/complaints');
    const { data: r2Complaints } = await resident2API.get('/user/complaints');

    const r1Ids = r1Complaints.map(c => c.id);
    const r2Ids = r2Complaints.map(c => c.id);

    // No overlap between the two
    const overlap = r1Ids.filter(id => r2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  test('resident1 vehicles are not visible to resident2', async ({ residentAPI, resident2API }) => {
    const { data: r1Vehicles } = await residentAPI.get('/user/vehicles');
    const { data: r2Vehicles } = await resident2API.get('/user/vehicles');

    const r1Ids = r1Vehicles.map(v => v.id);
    const r2Ids = r2Vehicles.map(v => v.id);

    const overlap = r1Ids.filter(id => r2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  test('resident1 family members are not visible to resident2', async ({ residentAPI, resident2API }) => {
    const { data: r1Members } = await residentAPI.get('/user/family-members');
    const { data: r2Members } = await resident2API.get('/user/family-members');

    const r1Ids = r1Members.map(m => m.id);
    const r2Ids = r2Members.map(m => m.id);

    const overlap = r1Ids.filter(id => r2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  test('resident1 visitor approvals are not visible to resident2', async ({ residentAPI, resident2API }) => {
    const { data: r1Approvals } = await residentAPI.get('/user/visitors/my-approvals');
    const { data: r2Approvals } = await resident2API.get('/user/visitors/my-approvals');

    const r1Ids = r1Approvals.map(a => a.id);
    const r2Ids = r2Approvals.map(a => a.id);

    const overlap = r1Ids.filter(id => r2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});
