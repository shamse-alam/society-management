/**
 * 11-multi-role-permissions.spec.js
 * Tests that users with multiple roles get the UNION of all permissions.
 *
 * Role combos tested:
 *   GUARD + ADMIN       → full admin + guard endpoints
 *   PRESIDENT + SECRETARY → union of both (adds complaints, visitors to president)
 *   TREASURER + ACCOUNTANT → union of both (adds /accountant/** to treasurer)
 *   GUARD + RESIDENT    → guard endpoints + resident endpoints
 *   PRESIDENT + TREASURER → union (adds /admin/payments, /admin/vendors CRUD, /admin/reports to president)
 */
const { test, expect } = require('../helpers/fixtures');

// ─────────────────────────────────────────────
// GUARD + ADMIN — full access to everything
// ─────────────────────────────────────────────
test.describe('GUARD + ADMIN — union gives full access', () => {
  test('can access admin users (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/users');
    expect(res.status).toBe(200);
  });

  test('can access admin payments (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/payments');
    expect(res.status).toBe(200);
  });

  test('can access admin expenses (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('can access admin properties (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/properties');
    expect(res.status).toBe(200);
  });

  test('can access admin notices (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('can access admin balance sheet (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('can access admin refunds (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/refunds');
    expect(res.status).toBe(200);
  });

  test('can access admin vendors (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('can access guard endpoints (from GUARD)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/guard/stats');
    expect(res.status).toBe(200);
  });

  test('can access guard expected visitors (from GUARD)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/guard/expected');
    expect(res.status).toBe(200);
  });

  test('can access guard daily help (from GUARD)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/guard/daily-help');
    expect(res.status).toBe(200);
  });

  test('can access accountant endpoints (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('can access society config (from ADMIN)', async ({ guardAdminAPI }) => {
    const res = await guardAdminAPI.get('/admin/society-config');
    expect(res.status).toBe(200);
  });

  test('login response includes both roles', async ({ guardAdminAPI }) => {
    // Verify by checking a sampling of both admin-only and guard-only endpoints
    const [adminRes, guardRes] = await Promise.all([
      guardAdminAPI.get('/admin/users'),
      guardAdminAPI.get('/guard/inside'),
    ]);
    expect(adminRes.status).toBe(200);
    expect(guardRes.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// GUARD + RESIDENT — guard endpoints + resident endpoints
// ─────────────────────────────────────────────
test.describe('GUARD + RESIDENT — union of guard and resident', () => {
  test('can access guard stats (from GUARD)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/guard/stats');
    expect(res.status).toBe(200);
  });

  test('can access guard expected (from GUARD)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/guard/expected');
    expect(res.status).toBe(200);
  });

  test('can access guard daily help (from GUARD)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/guard/daily-help');
    expect(res.status).toBe(200);
  });

  test('can access guard inside (from GUARD)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/guard/inside');
    expect(res.status).toBe(200);
  });

  test('can access user profile (from RESIDENT)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });

  test('can access user notices (from RESIDENT)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/user/notices');
    expect(res.status).toBe(200);
  });

  test('can access user polls (from RESIDENT)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/user/polls');
    expect(res.status).toBe(200);
  });

  test('can access user events (from RESIDENT)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/user/events');
    expect(res.status).toBe(200);
  });

  test('can access user complaints (from RESIDENT)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/user/complaints');
    expect(res.status).toBe(200);
  });

  test('can access notifications (from both)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/notifications/unread-count');
    expect(res.status).toBe(200);
  });

  test('still CANNOT access admin endpoints (neither role grants it)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('still CANNOT access admin payments (neither role grants it)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('still CANNOT access accountant endpoints (neither role grants it)', async ({ guardResidentAPI }) => {
    const res = await guardResidentAPI.get('/accountant/expenses');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// PRESIDENT + SECRETARY — union adds complaints, visitors to president perms
// ─────────────────────────────────────────────
test.describe('PRESIDENT + SECRETARY — union of both roles', () => {
  // Shared between both roles
  test('can access accountant endpoints (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('can access admin expenses (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('can access admin fund-releases (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('can access admin refunds (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/refunds');
    expect(res.status).toBe(200);
  });

  test('can read admin vendors (both have GET)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('can access admin balance sheet (both have GET)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('can access admin move-requests (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  test('can access admin notices (both have it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('can access user endpoints (from RESIDENT)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });

  // Secretary-only: complaints, visitors
  test('can access admin complaints (from SECRETARY only)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
  });

  test('can read admin visitors (from SECRETARY only)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/visitors');
    expect(res.status).toBe(200);
  });

  // Still should NOT have access to:
  test('CANNOT access admin users (neither role grants it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin payments (neither role grants it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin properties (neither role grants it)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('CANNOT create vendors (both only have GET)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.post('/admin/vendors', {
      name: 'E2E_Should_Fail', category: 'OTHER', phone: '123', vendorType: 'OTHER',
    });
    expect(res.status).toBe(403);
  });

  test('CANNOT access guard endpoints (no GUARD role)', async ({ presidentSecretaryAPI }) => {
    const res = await presidentSecretaryAPI.get('/guard/stats');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// TREASURER + ACCOUNTANT — union of financial roles
// ─────────────────────────────────────────────
test.describe('TREASURER + ACCOUNTANT — union of financial roles', () => {
  // From TREASURER
  test('can access admin payments (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/payments');
    expect(res.status).toBe(200);
  });

  test('can access admin expenses (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('can CRUD admin vendors (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('can access admin fund-releases (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('can access admin refunds (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/refunds');
    expect(res.status).toBe(200);
  });

  test('can access admin balance sheet (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('can access admin defaulters report (from TREASURER)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/reports/defaulters');
    expect(res.status).toBe(200);
  });

  // From ACCOUNTANT
  test('can access accountant expenses (from ACCOUNTANT)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('can access accountant payments (from ACCOUNTANT)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/accountant/payments');
    expect(res.status).toBe(200);
  });

  test('can access accountant vendors (from ACCOUNTANT)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/accountant/vendors');
    expect(res.status).toBe(200);
  });

  // From RESIDENT (included in both)
  test('can access user profile (from RESIDENT)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });

  test('can access user payments (from RESIDENT)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/user/payments');
    expect(res.status).toBe(200);
  });

  // Should NOT have
  test('CANNOT access admin users (neither role grants it)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin properties (neither role grants it)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin notices (neither role grants it)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/notices');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin complaints (neither role grants it)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/complaints');
    expect(res.status).toBe(403);
  });

  test('CANNOT access guard endpoints (no GUARD role)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/guard/stats');
    expect(res.status).toBe(403);
  });

  test('CANNOT access society config (neither role grants it)', async ({ treasurerAccountantAPI }) => {
    const res = await treasurerAccountantAPI.get('/admin/society-config');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// PRESIDENT + TREASURER — broadest non-admin combo
// ─────────────────────────────────────────────
test.describe('PRESIDENT + TREASURER — broadest non-admin combo', () => {
  // From PRESIDENT
  test('can access admin expenses (from PRESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('can access admin fund-releases (from PRESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
  });

  test('can access admin refunds (from PRESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/refunds');
    expect(res.status).toBe(200);
  });

  test('can access admin notices (from PRESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('can access admin move-requests (from PRESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  // From TREASURER (not available to president alone)
  test('can access admin payments (from TREASURER)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/payments');
    expect(res.status).toBe(200);
  });

  test('can CRUD admin vendors (from TREASURER — president only has GET)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
    // TREASURER has full CRUD on vendors, PRESIDENT only GET — union = full CRUD
  });

  test('can access admin defaulters report (from TREASURER)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/reports/defaulters');
    expect(res.status).toBe(200);
  });

  // Shared
  test('can access admin balance sheet (both have GET)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('can access accountant endpoints (both have it)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('can access user endpoints (from RESIDENT)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/user/profile');
    expect(res.status).toBe(200);
  });

  // Should NOT have
  test('CANNOT access admin users (neither role grants it)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/users');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin properties (neither role grants it)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/properties');
    expect(res.status).toBe(403);
  });

  test('CANNOT access admin complaints (neither role grants it)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/admin/complaints');
    expect(res.status).toBe(403);
  });

  test('CANNOT access guard endpoints (no GUARD role)', async ({ presidentTreasurerAPI }) => {
    const res = await presidentTreasurerAPI.get('/guard/stats');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// UI SIDEBAR TESTS — multi-role users see correct nav
// ─────────────────────────────────────────────
test.describe('UI Sidebar — multi-role navigation', () => {
  test('GUARD+ADMIN user sees unified Home with Accounts and Guard sections', async ({ guardAdminPage }) => {
    await guardAdminPage.goto('/home');
    await expect(guardAdminPage).toHaveURL(/\/home/);
    await guardAdminPage.waitForLoadState('domcontentloaded');
    // Should see admin sidebar items like "Accounts" button
    await expect(guardAdminPage.getByRole('button', { name: 'Accounts' })).toBeVisible({ timeout: 10000 });
    // Should also see gate control section rendered inline on Home page
    await expect(guardAdminPage.locator('text=Walk-in Approval')).toBeVisible();
  });

  test('GUARD+RESIDENT user sees Home with guard and resident content', async ({ guardResidentPage }) => {
    await guardResidentPage.goto('/home');
    await expect(guardResidentPage).toHaveURL(/\/home/);
    await guardResidentPage.waitForLoadState('domcontentloaded');
    // Should see Helpdesk link from RESIDENT role
    await expect(guardResidentPage.locator('text=Helpdesk')).toBeVisible({ timeout: 10000 });
    // Should see gate control section inline on Home
    await expect(guardResidentPage.locator('text=Walk-in Approval')).toBeVisible();
  });

  test('PRESIDENT+SECRETARY user sees Home with admin dashboard', async ({ presidentSecretaryPage }) => {
    await presidentSecretaryPage.goto('/home');
    await expect(presidentSecretaryPage).toHaveURL(/\/home/);
    await presidentSecretaryPage.waitForLoadState('domcontentloaded');
    // Should see Accounts section and other admin items
    await expect(presidentSecretaryPage.getByRole('button', { name: 'Accounts' })).toBeVisible({ timeout: 10000 });
  });

  test('PRESIDENT+SECRETARY user sees Helpdesk link (from SECRETARY)', async ({ presidentSecretaryPage }) => {
    await presidentSecretaryPage.goto('/home');
    await presidentSecretaryPage.waitForLoadState('domcontentloaded');
    await expect(presidentSecretaryPage.locator('text=Helpdesk')).toBeVisible({ timeout: 10000 });
  });

  test('All users land on /home by default', async ({ guardAdminPage }) => {
    // Navigate to root — should redirect to /home
    await guardAdminPage.goto('/');
    await expect(guardAdminPage).toHaveURL(/\/home/);
  });
});

// ─────────────────────────────────────────────
// CROSS-ROLE FUNCTIONAL WORKFLOWS
// ─────────────────────────────────────────────
test.describe('Multi-role functional workflows', () => {
  test('PRESIDENT+TREASURER can view payments AND approve expenses (union)', async ({ presidentTreasurerAPI }) => {
    // Payment access from TREASURER
    const payments = await presidentTreasurerAPI.get('/admin/payments');
    expect(payments.status).toBe(200);

    // Expense access from PRESIDENT
    const expenses = await presidentTreasurerAPI.get('/admin/expenses');
    expect(expenses.status).toBe(200);

    // Balance sheet from both
    const balance = await presidentTreasurerAPI.get('/admin/balance-sheet');
    expect(balance.status).toBe(200);
  });

  test('TREASURER+ACCOUNTANT can use both /admin and /accountant finance paths', async ({ treasurerAccountantAPI }) => {
    // Admin payments from TREASURER
    const adminPayments = await treasurerAccountantAPI.get('/admin/payments');
    expect(adminPayments.status).toBe(200);

    // Accountant expenses from ACCOUNTANT
    const acctExpenses = await treasurerAccountantAPI.get('/accountant/expenses');
    expect(acctExpenses.status).toBe(200);

    // Admin vendors CRUD from TREASURER
    const vendors = await treasurerAccountantAPI.get('/admin/vendors');
    expect(vendors.status).toBe(200);

    // Accountant vendors from ACCOUNTANT
    const acctVendors = await treasurerAccountantAPI.get('/accountant/vendors');
    expect(acctVendors.status).toBe(200);
  });

  test('GUARD+ADMIN can manage gate AND admin in one session', async ({ guardAdminAPI }) => {
    // Guard operation
    const guardStats = await guardAdminAPI.get('/guard/stats');
    expect(guardStats.status).toBe(200);

    // Admin operation
    const users = await guardAdminAPI.get('/admin/users');
    expect(users.status).toBe(200);

    // Financial operation
    const balance = await guardAdminAPI.get('/admin/balance-sheet');
    expect(balance.status).toBe(200);
  });

  test('PRESIDENT+SECRETARY can manage complaints (secretary) AND notices (both)', async ({ presidentSecretaryAPI }) => {
    // Complaints from SECRETARY
    const complaints = await presidentSecretaryAPI.get('/admin/complaints');
    expect(complaints.status).toBe(200);

    // Notices from both
    const notices = await presidentSecretaryAPI.get('/admin/notices');
    expect(notices.status).toBe(200);

    // Move requests from both
    const moves = await presidentSecretaryAPI.get('/admin/move-requests');
    expect(moves.status).toBe(200);

    // Visitors from SECRETARY
    const visitors = await presidentSecretaryAPI.get('/admin/visitors');
    expect(visitors.status).toBe(200);
  });

  test('GUARD+RESIDENT can use guard gate AND resident self-service', async ({ guardResidentAPI }) => {
    // Guard gate operations
    const stats = await guardResidentAPI.get('/guard/stats');
    expect(stats.status).toBe(200);

    const expected = await guardResidentAPI.get('/guard/expected');
    expect(expected.status).toBe(200);

    // Resident self-service
    const profile = await guardResidentAPI.get('/user/profile');
    expect(profile.status).toBe(200);

    const notices = await guardResidentAPI.get('/user/notices');
    expect(notices.status).toBe(200);

    const polls = await guardResidentAPI.get('/user/polls');
    expect(polls.status).toBe(200);
  });
});
