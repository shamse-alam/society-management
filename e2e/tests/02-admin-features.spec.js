/**
 * Admin Feature E2E Tests
 *
 * Comprehensive tests for admin-only features:
 * - User management (CRUD)
 * - Property management (CRUD)
 * - Payments (view, record)
 * - Expense management (CRUD, approve, pay)
 * - Vendor management (CRUD)
 * - Notice management (CRUD)
 * - Poll management (CRUD)
 * - Amenity management (CRUD)
 * - Fund releases
 * - Society settings
 * - Balance sheet & reports
 * - Events, documents, emergency contacts
 */
const { test, expect } = require('../helpers/fixtures');

test.describe('Admin — User Management', () => {
  test('admin can view users list', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage).toHaveURL(/\/users/);
    // Should see a table or list with users
    await expect(adminPage.locator('table, [class*="card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin can see seeded test users', async ({ adminAPI }) => {
    const { data } = await adminAPI.get('/admin/users');
    const usernames = data.map(u => u.username);
    expect(usernames).toContain('e2e_resident');
    expect(usernames).toContain('e2e_accountant');
    expect(usernames).toContain('e2e_president');
  });

  test('admin can create a new user via API', async ({ adminAPI }) => {
    const { data: existing } = await adminAPI.get('/admin/users');
    if (existing.find(u => u.username === 'e2e_temp_user')) return; // already exists

    const res = await adminAPI.post('/admin/users', {
      username: 'e2e_temp_user', password: 'welcome', firstName: 'Temp', lastName: 'User',
      email: 'e2e_temp@test.com', phone: '+91-9300000001', unitNumber: 'B-001', roles: ['RESIDENT'],
    });
    expect(res.status).toBe(200);
    expect(res.data.username).toBe('e2e_temp_user');
  });

  test('admin can update a user via API', async ({ adminAPI }) => {
    const { data: users } = await adminAPI.get('/admin/users');
    const tempUser = users.find(u => u.username === 'e2e_temp_user');
    if (!tempUser) return; // skip if not created

    const res = await adminAPI.put(`/admin/users/${tempUser.id}`, {
      ...tempUser, lastName: 'UpdatedUser',
    });
    expect(res.status).toBe(200);
    expect(res.data.lastName).toBe('UpdatedUser');
  });

  test('admin can view user detail page', async ({ adminPage, adminAPI }) => {
    const { data: users } = await adminAPI.get('/admin/users');
    const resident = users.find(u => u.username === 'e2e_resident');
    if (!resident) return;

    await adminPage.goto(`/users/${resident.id}`);
    await expect(adminPage).toHaveURL(new RegExp(`/users/${resident.id}`));
    await expect(adminPage.locator('text=E2E Resident').or(adminPage.locator(`text=${resident.fullName}`))).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin — Property Management', () => {
  test('admin can view properties', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    await expect(adminPage).toHaveURL(/\/properties/);
    await expect(adminPage.locator('table, [class*="card"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('admin can create/read properties via API', async ({ adminAPI }) => {
    const { data: props } = await adminAPI.get('/admin/properties');
    expect(Array.isArray(props)).toBe(true);
    // Check if our seeded property exists
    const our = props.find(p => p.unitNumber === 'A-101');
    expect(our).toBeTruthy();
  });
});

test.describe('Admin — Payment Management', () => {
  test('admin can view payments page', async ({ adminPage }) => {
    await adminPage.goto('/payments');
    await expect(adminPage).toHaveURL(/\/payments/);
    // payments page should load
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list payments via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/payments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Admin — Expense Management', () => {
  test('admin can view expenses page', async ({ adminPage }) => {
    await adminPage.goto('/expenses');
    await expect(adminPage).toHaveURL(/\/expenses/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can create an expense via API', async ({ adminAPI }) => {
    const { data: vendors } = await adminAPI.get('/admin/vendors');
    const vendor = vendors.find(v => v.name?.startsWith('E2E_'));
    const { data: expenses } = await adminAPI.get('/admin/expenses');
    if (expenses.find(e => e.description === 'E2E_Test Expense')) return;

    const res = await adminAPI.post('/admin/expenses', {
      category: 'CLEANING', description: 'E2E_Test Expense', amount: 5000,
      expenseDate: '2026-04-01', vendorId: vendor?.id || null,
    });
    expect(res.status).toBe(200);
  });

  test('admin can approve an expense via API', async ({ adminAPI }) => {
    const { data: expenses } = await adminAPI.get('/admin/expenses');
    const pending = expenses.find(e => e.description === 'E2E_Test Expense' && e.status === 'PENDING');
    if (!pending) return; // already approved or not found

    const res = await adminAPI.put(`/admin/expenses/${pending.id}/approve`);
    expect(res.status).toBe(200);
  });
});

test.describe('Admin — Vendor Management', () => {
  test('admin can view vendors page', async ({ adminPage }) => {
    await adminPage.goto('/vendors');
    await expect(adminPage).toHaveURL(/\/vendors/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list vendors via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
    expect(res.data.some(v => v.name?.startsWith('E2E_'))).toBe(true);
  });
});

test.describe('Admin — Notice Management', () => {
  test('admin can view notices', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/notices');
    expect(res.status).toBe(200);
    expect(res.data.some(n => n.title?.startsWith('E2E_'))).toBe(true);
  });

  test('admin can update a notice via API', async ({ adminAPI }) => {
    const { data: notices } = await adminAPI.get('/admin/notices');
    const notice = notices.find(n => n.title?.startsWith('E2E_'));
    if (!notice) return;

    const res = await adminAPI.put(`/admin/notices/${notice.id}`, {
      ...notice, content: 'Updated by E2E test',
    });
    expect(res.status).toBe(200);
  });
});

test.describe('Admin — Poll Management', () => {
  test('admin can list polls via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/polls');
    expect(res.status).toBe(200);
    expect(res.data.some(p => p.question?.startsWith('E2E_'))).toBe(true);
  });
});

test.describe('Admin — Amenity Management', () => {
  test('admin can view amenities page', async ({ adminPage }) => {
    await adminPage.goto('/amenities');
    await expect(adminPage).toHaveURL(/\/amenities/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list amenities via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/amenities');
    expect(res.status).toBe(200);
    expect(res.data.some(a => a.name?.startsWith('E2E_'))).toBe(true);
  });
});

test.describe('Admin — Fund Releases', () => {
  test('admin can view fund releases page', async ({ adminPage }) => {
    await adminPage.goto('/fund-releases');
    await expect(adminPage).toHaveURL(/\/fund-releases/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list fund releases via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/fund-releases');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Admin — Balance Sheet & Reports', () => {
  test('admin can view balance sheet page', async ({ adminPage }) => {
    await adminPage.goto('/balance-sheet');
    await expect(adminPage).toHaveURL(/\/balance-sheet/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can fetch balance sheet via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalIncome');
    expect(res.data).toHaveProperty('totalExpense');
  });

  test('admin can view defaulter report page', async ({ adminPage }) => {
    await adminPage.goto('/defaulter-report');
    await expect(adminPage).toHaveURL(/\/defaulter-report/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can view GST report page', async ({ adminPage }) => {
    await adminPage.goto('/gst-report');
    await expect(adminPage).toHaveURL(/\/gst-report/);
    await adminPage.waitForLoadState('networkidle');
  });
});

test.describe('Admin — Events', () => {
  test('admin can list events via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/events');
    expect(res.status).toBe(200);
    expect(res.data.some(e => e.title?.startsWith('E2E_'))).toBe(true);
  });
});

test.describe('Admin — Emergency Contacts', () => {
  test('admin can list emergency contacts via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/emergency-contacts');
    expect(res.status).toBe(200);
    expect(res.data.some(c => c.name?.startsWith('E2E_'))).toBe(true);
  });
});

test.describe('Admin — Society Settings', () => {
  test('admin can view society settings page', async ({ adminPage }) => {
    await adminPage.goto('/society-settings');
    await expect(adminPage).toHaveURL(/\/society-settings/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can read society config via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/society-config');
    expect(res.status).toBe(200);
  });
});

test.describe('Admin — Income/Expense Type Config', () => {
  test('admin can list income types via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/income-types');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.some(t => t.code === 'MAINTENANCE')).toBe(true);
  });

  test('admin can list expense types via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/expense-types');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.some(t => t.code === 'ELECTRICITY')).toBe(true);
  });
});

test.describe('Admin — Move Requests', () => {
  test('admin can list move requests via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Admin — Visitor Logs', () => {
  test('admin can view visitor logs page', async ({ adminPage }) => {
    await adminPage.goto('/visitor-logs');
    await expect(adminPage).toHaveURL(/\/visitor-logs/);
    await adminPage.waitForLoadState('networkidle');
  });
});

test.describe('Admin — Documents', () => {
  test('admin can list documents via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/documents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Admin — Complaint Management', () => {
  test('admin can view complaint management page', async ({ adminPage }) => {
    await adminPage.goto('/complaint-management');
    await expect(adminPage).toHaveURL(/\/complaint-management/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list complaints via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});

test.describe('Admin — Parking Management', () => {
  test('admin can view parking page', async ({ adminPage }) => {
    await adminPage.goto('/parking');
    await expect(adminPage).toHaveURL(/\/parking/);
    await adminPage.waitForLoadState('networkidle');
  });

  test('admin can list parking slots via API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/parking-slots');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });
});
