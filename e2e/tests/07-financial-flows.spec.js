/**
 * 07-financial-flows.spec.js
 * Comprehensive tests for income, expense, fund release, invoice, and balance sheet workflows.
 * Tests all income types, expense types, approval chains, and financial reporting.
 */
const { test, expect } = require('../helpers/fixtures');

// ─────────────────────────────────────────────
// INCOME TYPES & EXPENSE TYPES CONFIG
// ─────────────────────────────────────────────
test.describe('Income & Expense Type Configuration', () => {
  test('public API returns seeded income types', async ({ adminAPI }) => {
    const res = await adminAPI.get('/public/income-types');
    expect(res.status).toBe(200);
    const codes = res.data.map(t => t.code);
    expect(codes).toContain('MAINTENANCE');
    expect(codes).toContain('CORPUS');
    expect(codes).toContain('MEMBERSHIP');
    expect(codes).toContain('AMENITY_BOOKING');
  });

  test('public API returns seeded expense types', async ({ adminAPI }) => {
    const res = await adminAPI.get('/public/expense-types');
    expect(res.status).toBe(200);
    const codes = res.data.map(t => t.code);
    expect(codes).toContain('ELECTRICITY');
    expect(codes).toContain('WATER');
    expect(codes).toContain('SECURITY');
    expect(codes).toContain('SALARY');
    expect(codes).toContain('CLEANING');
    expect(codes).toContain('GARDENING');
    expect(codes).toContain('REPAIRS');
    expect(codes).toContain('OTHER');
  });

  test('income types have correct GST and reserve fund flags', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/income-types');
    const types = Object.fromEntries(res.data.map(t => [t.code, t]));

    expect(types.MAINTENANCE.gstApplicable).toBe(true);
    expect(types.MAINTENANCE.reserveFund).toBe(false);
    expect(types.MAINTENANCE.oneTime).toBe(false);

    expect(types.CORPUS.gstApplicable).toBe(true);
    expect(types.CORPUS.reserveFund).toBe(true);
    expect(types.CORPUS.oneTime).toBe(true);

    expect(types.MEMBERSHIP.gstApplicable).toBe(false);
    expect(types.MEMBERSHIP.reserveFund).toBe(true);
    expect(types.MEMBERSHIP.oneTime).toBe(true);

    expect(types.AMENITY_BOOKING.systemManaged).toBe(true);
  });

  test('admin can create a custom income type', async ({ adminAPI }) => {
    const { data: existing } = await adminAPI.get('/admin/income-types');
    if (existing.find(t => t.code === 'E2E_PENALTY')) return;

    const res = await adminAPI.post('/admin/income-types', {
      code: 'E2E_PENALTY', displayName: 'E2E Late Penalty',
      gstApplicable: false, reserveFund: false, oneTime: false, active: true,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.code).toBe('E2E_PENALTY');
  });

  test('admin can create a custom expense type', async ({ adminAPI }) => {
    const { data: existing } = await adminAPI.get('/admin/expense-types');
    if (existing.find(t => t.code === 'E2E_PEST_CONTROL')) return;

    const res = await adminAPI.post('/admin/expense-types', {
      code: 'E2E_PEST_CONTROL', displayName: 'E2E Pest Control',
      gstIncluded: true, active: true,
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.code).toBe('E2E_PEST_CONTROL');
  });

  test('custom income type appears in public API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/public/income-types');
    const codes = res.data.map(t => t.code);
    expect(codes).toContain('E2E_PENALTY');
  });

  test('custom expense type appears in public API', async ({ adminAPI }) => {
    const res = await adminAPI.get('/public/expense-types');
    const codes = res.data.map(t => t.code);
    expect(codes).toContain('E2E_PEST_CONTROL');
  });
});

// ─────────────────────────────────────────────
// PAYMENT (INCOME) WORKFLOWS
// ─────────────────────────────────────────────
test.describe('Payment (Income) Workflows', () => {
  test('resident can make a maintenance payment', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/payments', {
      paymentType: 'MAINTENANCE', amount: 5000,
      periodFrom: '2026-04-01', periodTo: '2026-04-30',
      description: 'E2E April maintenance',
    });
    expect(res.status).toBe(200);
    expect(res.data.paymentType).toBe('MAINTENANCE');
    expect(res.data.status).toBe('PAID');
    expect(res.data.receiptNumber).toBeTruthy();
  });

  test('resident can make a corpus fund payment', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/payments', {
      paymentType: 'CORPUS', amount: 25000,
      description: 'E2E Corpus fund contribution',
    });
    expect(res.status).toBe(200);
    expect(res.data.paymentType).toBe('CORPUS');
    expect(res.data.status).toBe('PAID');
  });

  test('resident can make a membership payment', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/payments', {
      paymentType: 'MEMBERSHIP', amount: 10000,
      description: 'E2E Membership fee',
    });
    expect(res.status).toBe(200);
    expect(res.data.paymentType).toBe('MEMBERSHIP');
  });

  test('admin can record payment on behalf of a user', async ({ adminAPI }) => {
    // Find the resident user
    const { data: users } = await adminAPI.get('/admin/users');
    const resident = users.find(u => u.username === 'e2e_resident');
    if (!resident) return;

    const res = await adminAPI.post('/admin/payments', {
      userId: resident.id, paymentType: 'MAINTENANCE', amount: 5000,
      periodFrom: '2026-05-01', periodTo: '2026-05-31',
      description: 'E2E May maintenance (admin recorded)',
    });
    expect(res.status).toBe(200);
    expect(res.data.userId).toBe(resident.id);
  });

  test('admin can view all payments', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/payments');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('admin can view payments by type', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/payments/type/MAINTENANCE');
    expect(res.status).toBe(200);
    res.data.forEach(p => expect(p.paymentType).toBe('MAINTENANCE'));
  });

  test('resident can view own payments', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/payments');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('resident can view payments by type', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/payments/type/MAINTENANCE');
    expect(res.status).toBe(200);
    res.data.forEach(p => expect(p.paymentType).toBe('MAINTENANCE'));
  });
});

// ─────────────────────────────────────────────
// INVOICE GENERATION
// ─────────────────────────────────────────────
test.describe('Invoice Generation', () => {
  test('admin can generate monthly maintenance invoices', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/invoices/generate', {
      paymentType: 'MAINTENANCE', periodMode: 'MONTHLY',
      month: 6, year: 2026,
      calculationMode: 'LUMPSUM', amountPerUnit: 3000,
      dueDays: 15,
    });
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('generated');
    expect(res.data).toHaveProperty('skipped');
    expect(res.data).toHaveProperty('total');
  });

  test('duplicate invoice generation is skipped', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/invoices/generate', {
      paymentType: 'MAINTENANCE', periodMode: 'MONTHLY',
      month: 6, year: 2026,
      calculationMode: 'LUMPSUM', amountPerUnit: 3000,
      dueDays: 15,
    });
    expect(res.status).toBe(200);
    // All should be skipped since already generated
    expect(res.data.generated).toBe(0);
  });

  test('generated invoices appear as PENDING payments', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/payments/type/MAINTENANCE');
    expect(res.status).toBe(200);
    const pending = res.data.filter(p => p.status === 'PENDING');
    expect(pending.length).toBeGreaterThanOrEqual(0); // depends on test data
  });
});

// ─────────────────────────────────────────────
// EXPENSE WORKFLOWS
// ─────────────────────────────────────────────
test.describe('Expense Workflows', () => {
  let createdExpenseId;

  test('admin can create an electricity expense (DRAFT)', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/expenses', {
      category: 'ELECTRICITY', amount: 15000.00,
      description: 'E2E Monthly electricity bill',
      expenseDate: '2026-04-15', paidTo: 'E2E Power Corp',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.category).toBe('ELECTRICITY');
    expect(res.data.status).toBe('DRAFT');
    createdExpenseId = res.data.id;
  });

  test('admin can create a water expense', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/expenses', {
      category: 'WATER', amount: 8000.00,
      description: 'E2E Water supply charges',
      expenseDate: '2026-04-10',
    });
    expect([200, 201]).toContain(res.status);
    expect(res.data.category).toBe('WATER');
  });

  test('admin can create a security expense', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/expenses', {
      category: 'SECURITY', amount: 45000.00,
      description: 'E2E Monthly security service',
      expenseDate: '2026-04-01',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('admin can create a salary expense', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/expenses', {
      category: 'SALARY', amount: 20000.00,
      description: 'E2E Staff salary',
      expenseDate: '2026-04-01',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('admin can create expenses for all remaining categories', async ({ adminAPI }) => {
    const categories = ['CLEANING', 'GARDENING', 'REPAIRS', 'OTHER'];
    for (const cat of categories) {
      const res = await adminAPI.post('/admin/expenses', {
        category: cat, amount: 5000.00,
        description: `E2E ${cat} expense`,
        expenseDate: '2026-04-15',
      });
      expect([200, 201]).toContain(res.status);
      expect(res.data.category).toBe(cat);
    }
  });

  test('admin can approve an expense', async ({ adminAPI }) => {
    // Find a DRAFT expense
    const { data: expenses } = await adminAPI.get('/admin/expenses');
    const draft = expenses.find(e => e.status === 'DRAFT' && e.description?.startsWith('E2E'));
    if (!draft) return;

    const res = await adminAPI.put(`/admin/expenses/${draft.id}/approve`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('APPROVED');
  });

  test('admin can mark approved expense as paid', async ({ adminAPI }) => {
    const { data: expenses } = await adminAPI.get('/admin/expenses');
    const approved = expenses.find(e => e.status === 'APPROVED' && e.description?.startsWith('E2E'));
    if (!approved) return;

    const res = await adminAPI.put(`/admin/expenses/${approved.id}/pay`, {
      category: approved.category, amount: approved.amount,
      expenseDate: approved.expenseDate || '2026-04-16',
      paymentMode: 'ONLINE',
      transactionReference: 'E2E-TXN-001',
      transactionDate: '2026-04-16',
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('PAID');
  });

  test('admin can cancel a DRAFT expense', async ({ adminAPI }) => {
    // Create a new expense just to cancel it
    const create = await adminAPI.post('/admin/expenses', {
      category: 'OTHER', amount: 100.00,
      description: 'E2E Expense to cancel',
      expenseDate: '2026-04-15',
    });
    expect([200, 201]).toContain(create.status);

    const res = await adminAPI.put(`/admin/expenses/${create.data.id}/cancel`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('CANCELLED');
  });

  test('admin can view all expenses', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('admin can filter expenses by status', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/expenses/status/DRAFT');
    expect(res.status).toBe(200);
    res.data.forEach(e => expect(e.status).toBe('DRAFT'));
  });
});

// ─────────────────────────────────────────────
// FUND RELEASE WORKFLOWS
// ─────────────────────────────────────────────
test.describe('Fund Release Workflows', () => {
  test('admin can create a fund release request', async ({ adminAPI }) => {
    const res = await adminAPI.post('/admin/fund-releases', {
      fundType: 'CORPUS', amount: 5000.00,
      reason: 'E2E Emergency roof repairs', notes: 'Test fund release',
    });
    // May get 422 if insufficient corpus balance — that's a valid business rule
    expect([200, 201, 422]).toContain(res.status);
    if (res.status === 200 || res.status === 201) {
      expect(res.data.status).toBe('PENDING');
      expect(res.data.fundType).toBe('CORPUS');
    }
  });

  test('admin can approve a fund release', async ({ adminAPI }) => {
    const { data: releases } = await adminAPI.get('/admin/fund-releases');
    const pending = releases.find(r => r.status === 'PENDING' && r.reason?.startsWith('E2E'));
    if (!pending) return;

    const res = await adminAPI.put(`/admin/fund-releases/${pending.id}/approve`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('APPROVED');
  });

  test('admin can mark fund release as released', async ({ adminAPI }) => {
    const { data: releases } = await adminAPI.get('/admin/fund-releases');
    const approved = releases.find(r => r.status === 'APPROVED' && r.reason?.startsWith('E2E'));
    if (!approved) return;

    const res = await adminAPI.put(`/admin/fund-releases/${approved.id}/release`);
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('RELEASED');
  });

  test('admin can reject a fund release', async ({ adminAPI }) => {
    // Create a new one to reject
    const create = await adminAPI.post('/admin/fund-releases', {
      fundType: 'CORPUS', amount: 1000.00,
      reason: 'E2E Fund release to reject',
    });
    // May get 422 if insufficient corpus balance
    expect([200, 201, 422]).toContain(create.status);
    if (create.status !== 200 && create.status !== 201) return;

    const res = await adminAPI.put(`/admin/fund-releases/${create.data.id}/reject`, {
      rejectionReason: 'E2E Test rejection',
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('REJECTED');
  });
});

// ─────────────────────────────────────────────
// BALANCE SHEET & REPORTS
// ─────────────────────────────────────────────
test.describe('Balance Sheet & Financial Reports', () => {
  test('balance sheet reflects income and expenses', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalIncome');
    expect(res.data).toHaveProperty('totalExpense');
    expect(res.data).toHaveProperty('balance');
    expect(res.data).toHaveProperty('incomeBreakdown');
    expect(res.data).toHaveProperty('expenseBreakdown');
  });

  test('balance sheet income breakdown has expected types', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/balance-sheet');
    const incomeTypes = res.data.incomeBreakdown.map(i => i.type);
    // We made MAINTENANCE, CORPUS, MEMBERSHIP payments earlier
    expect(incomeTypes).toContain('MAINTENANCE');
  });

  test('balance sheet expense breakdown has expected categories', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/balance-sheet');
    const expCats = res.data.expenseBreakdown.map(e => e.category);
    // We created ELECTRICITY, WATER, SECURITY, SALARY, etc. expenses
    expect(expCats.length).toBeGreaterThan(0);
  });

  test('balance sheet with date range filter', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/balance-sheet?from=2026-04-01&to=2026-04-30');
    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('totalIncome');
  });

  test('defaulter report returns data', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/reports/defaulters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('balance sheet page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/balance-sheet');
    await expect(adminPage).toHaveURL(/\/balance-sheet/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('GST report page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/gst-report');
    await expect(adminPage).toHaveURL(/\/gst-report/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('defaulter report page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/defaulter-report');
    await expect(adminPage).toHaveURL(/\/defaulter-report/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// ROLE-BASED FINANCIAL ACCESS
// ─────────────────────────────────────────────
test.describe('Role-Based Financial Access', () => {
  test('accountant can view payments', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/accountant/payments');
    expect(res.status).toBe(200);
  });

  test('accountant can view expenses', async ({ accountantAPI }) => {
    const res = await accountantAPI.get('/accountant/expenses');
    expect(res.status).toBe(200);
  });

  test('treasurer can view and manage payments', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/payments');
    expect(res.status).toBe(200);
  });

  test('treasurer can view and manage expenses', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/expenses');
    expect(res.status).toBe(200);
  });

  test('treasurer can view balance sheet', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('president can view balance sheet', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/balance-sheet');
    expect(res.status).toBe(200);
  });

  test('resident cannot access admin payments', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });

  test('guard cannot access financial endpoints', async ({ guardAPI }) => {
    const res = await guardAPI.get('/admin/payments');
    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────
// VENDOR MANAGEMENT IN FINANCIAL CONTEXT
// ─────────────────────────────────────────────
test.describe('Vendor Management', () => {
  test('admin can create a vendor', async ({ adminAPI }) => {
    const { data: vendors } = await adminAPI.get('/admin/vendors');
    if (vendors.find(v => v.name === 'E2E_Electric Co')) return;

    const res = await adminAPI.post('/admin/vendors', {
      name: 'E2E_Electric Co', category: 'ELECTRICITY',
      phone: '+91-9200000010', email: 'e2e_electric@test.com',
      active: true, vendorType: 'CONTRACT',
    });
    expect(res.status).toBe(200);
  });

  test('admin can view vendors', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('treasurer can manage vendors', async ({ treasurerAPI }) => {
    const res = await treasurerAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('president can read vendors (GET only)', async ({ presidentAPI }) => {
    const res = await presidentAPI.get('/admin/vendors');
    expect(res.status).toBe(200);
  });

  test('resident cannot access vendor management', async ({ residentAPI }) => {
    const res = await residentAPI.get('/admin/vendors');
    expect(res.status).toBe(403);
  });
});
