/**
 * 06-navigation-menus.spec.js
 * Validates sidebar menus, links, and page rendering for ALL roles.
 *
 * Menu visibility depends on role flags in Layout.jsx:
 *   canManageAccounts = ADMIN || ACCOUNTANT || TREASURER || PRESIDENT
 *   canManageSociety  = ADMIN || PRESIDENT || SECRETARY
 *
 * Guard only sees the Guard Dashboard — no sidebar at all.
 */
const { test, expect } = require('../helpers/fixtures');

// Helper: click a sidebar section button to expand it, then return visible link texts
async function expandSection(page, sectionName) {
  const btn = page.locator('nav button', { hasText: sectionName });
  if (await btn.count() > 0) {
    await btn.click();
    // Wait for sub-items to appear
    await page.waitForTimeout(300);
    return true;
  }
  return false;
}

// Helper: check sidebar has a specific link
async function hasSidebarLink(page, linkText) {
  const link = page.locator('nav a', { hasText: new RegExp(`^\\s*${linkText}\\s*$`) });
  return (await link.count()) > 0;
}

// Helper: check sidebar has a section button
async function hasSidebarSection(page, sectionText) {
  const btn = page.locator('nav button', { hasText: sectionText });
  return (await btn.count()) > 0;
}

// Helper: navigate via sidebar link and wait for page
async function navigateViaMenu(page, linkText, expectedPath) {
  const link = page.locator('nav a', { hasText: new RegExp(`^\\s*${linkText}\\s*$`) }).first();
  await link.click();
  await page.waitForURL(url => url.pathname.includes(expectedPath), { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
}

// ─────────────────────────────────────────────
// ADMIN NAVIGATION
// ─────────────────────────────────────────────
test.describe('Admin — Sidebar Navigation', () => {
  test('admin sees correct dashboard link', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await expect(adminPage.locator('nav a', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('admin sees Accounts section with all sub-items', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Accounts')).toBe(true);
    await expandSection(adminPage, 'Accounts');
    for (const label of ['Income', 'Expenditure', 'Vendors', 'Receipts & Payments', 'Reserve Funds', 'GST Statement', 'Defaulter Report']) {
      expect(await hasSidebarLink(adminPage, label)).toBe(true);
    }
  });

  test('admin sees Society section with all sub-items', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Society')).toBe(true);
    await expandSection(adminPage, 'Society');
    for (const label of ['Members', 'Households', 'Vehicles', 'Parking', 'Move In/Out']) {
      expect(await hasSidebarLink(adminPage, label)).toBe(true);
    }
  });

  test('admin sees Community section', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Community')).toBe(true);
    await expandSection(adminPage, 'Community');
    for (const label of ['Notice Board', 'Discussion Forum', 'Events', 'Polls & Voting', 'Documents', 'Emergency Contacts']) {
      expect(await hasSidebarLink(adminPage, label)).toBe(true);
    }
  });

  test('admin sees Helpdesk link to complaint management', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    const helpdesk = adminPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toBeVisible();
    await expect(helpdesk).toHaveAttribute('href', '/complaint-management');
  });

  test('admin sees Facilities section with Manage Amenities', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Facilities')).toBe(true);
    await expandSection(adminPage, 'Facilities');
    expect(await hasSidebarLink(adminPage, 'Manage Amenities')).toBe(true);
    expect(await hasSidebarLink(adminPage, 'Book Facility')).toBe(true);
    expect(await hasSidebarLink(adminPage, 'Reservation Requests')).toBe(true);
  });

  test('admin sees Visitors section with Visitor Logs', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Visitors')).toBe(true);
    await expandSection(adminPage, 'Visitors');
    expect(await hasSidebarLink(adminPage, 'Visitor Logs')).toBe(true);
  });

  test('admin sees Settings with Society Settings', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarSection(adminPage, 'Settings')).toBe(true);
    await expandSection(adminPage, 'Settings');
    expect(await hasSidebarLink(adminPage, 'User Settings')).toBe(true);
    expect(await hasSidebarLink(adminPage, 'Society Settings')).toBe(true);
  });

  test('admin does NOT see My Property section', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    expect(await hasSidebarLink(adminPage, 'My Vehicles')).toBe(false);
    expect(await hasSidebarLink(adminPage, 'Move Requests')).toBe(false);
  });

  test('admin does NOT see Payments section (user version)', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    // Admin should not see user payment sub-items
    expect(await hasSidebarLink(adminPage, 'Maintenance')).toBe(false);
    expect(await hasSidebarLink(adminPage, 'Membership')).toBe(false);
    expect(await hasSidebarLink(adminPage, 'Corpus Fund')).toBe(false);
  });

  test('admin can navigate to all Accounts pages', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');

    await navigateViaMenu(adminPage, 'Income', '/payments');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'Expenditure', '/expenses');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'Vendors', '/vendors');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'Receipts & Payments', '/balance-sheet');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'Reserve Funds', '/fund-releases');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'GST Statement', '/gst-report');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Accounts');
    await navigateViaMenu(adminPage, 'Defaulter Report', '/defaulter-report');
  });

  test('admin can navigate to all Society pages', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Society');
    await navigateViaMenu(adminPage, 'Members', '/users');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Society');
    await navigateViaMenu(adminPage, 'Households', '/household');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Society');
    await navigateViaMenu(adminPage, 'Vehicles', '/vehicles');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Society');
    await navigateViaMenu(adminPage, 'Parking', '/parking');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Society');
    await navigateViaMenu(adminPage, 'Move In/Out', '/move-requests');
  });

  test('admin can navigate to all Community pages', async ({ adminPage }) => {
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Notice Board', '/notices');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Discussion Forum', '/forum');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Events', '/events');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Polls & Voting', '/polls');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Documents', '/documents');
    await adminPage.goto('/dashboard');
    await expandSection(adminPage, 'Community');
    await navigateViaMenu(adminPage, 'Emergency Contacts', '/emergency');
  });
});

// ─────────────────────────────────────────────
// GUARD NAVIGATION
// ─────────────────────────────────────────────
test.describe('Guard — Sidebar Navigation', () => {
  test('guard sees Guard Dashboard', async ({ guardPage }) => {
    await guardPage.goto('/guard-dashboard');
    await expect(guardPage.locator('nav a', { hasText: 'Guard Dashboard' })).toBeVisible();
  });

  test('guard does NOT see Accounts, Society, Community, Facilities, Visitors, Settings sections', async ({ guardPage }) => {
    await guardPage.goto('/guard-dashboard');
    for (const section of ['Accounts', 'Society', 'Community', 'Facilities', 'Visitors', 'Settings']) {
      expect(await hasSidebarSection(guardPage, section)).toBe(false);
    }
    expect(await hasSidebarLink(guardPage, 'Helpdesk')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// PRESIDENT NAVIGATION
// ─────────────────────────────────────────────
test.describe('President — Sidebar Navigation', () => {
  test('president sees Admin Dashboard', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    await expect(presidentPage.locator('nav a', { hasText: 'Dashboard' })).toBeVisible();
    await expect(presidentPage).toHaveURL(/\/dashboard/);
  });

  test('president sees Accounts section (canManageAccounts)', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    expect(await hasSidebarSection(presidentPage, 'Accounts')).toBe(true);
    await expandSection(presidentPage, 'Accounts');
    expect(await hasSidebarLink(presidentPage, 'Income')).toBe(true);
    expect(await hasSidebarLink(presidentPage, 'Expenditure')).toBe(true);
    expect(await hasSidebarLink(presidentPage, 'Vendors')).toBe(true);
  });

  test('president sees Society section (canManageSociety)', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    expect(await hasSidebarSection(presidentPage, 'Society')).toBe(true);
    await expandSection(presidentPage, 'Society');
    expect(await hasSidebarLink(presidentPage, 'Members')).toBe(true);
  });

  test('president sees Community + Helpdesk (complaint-management)', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    expect(await hasSidebarSection(presidentPage, 'Community')).toBe(true);
    const helpdesk = presidentPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaint-management');
  });

  test('president sees full Facilities (Manage Amenities + Reservation Requests)', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    await expandSection(presidentPage, 'Facilities');
    expect(await hasSidebarLink(presidentPage, 'Manage Amenities')).toBe(true);
    expect(await hasSidebarLink(presidentPage, 'Reservation Requests')).toBe(true);
  });

  test('president sees Visitors (Visitor Logs)', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    await expandSection(presidentPage, 'Visitors');
    expect(await hasSidebarLink(presidentPage, 'Visitor Logs')).toBe(true);
  });

  test('president sees Society Settings', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    await expandSection(presidentPage, 'Settings');
    expect(await hasSidebarLink(presidentPage, 'Society Settings')).toBe(true);
  });

  test('president does NOT see My Property or user Payments', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    expect(await hasSidebarLink(presidentPage, 'My Vehicles')).toBe(false);
    expect(await hasSidebarLink(presidentPage, 'Corpus Fund')).toBe(false);
  });

  test('president can navigate to key pages', async ({ presidentPage }) => {
    await presidentPage.goto('/dashboard');
    await expandSection(presidentPage, 'Accounts');
    await navigateViaMenu(presidentPage, 'Income', '/payments');
    await presidentPage.goto('/dashboard');
    await expandSection(presidentPage, 'Society');
    await navigateViaMenu(presidentPage, 'Members', '/users');
  });
});

// ─────────────────────────────────────────────
// SECRETARY NAVIGATION
// ─────────────────────────────────────────────
test.describe('Secretary — Sidebar Navigation', () => {
  test('secretary sees Admin Dashboard', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    await expect(secretaryPage).toHaveURL(/\/dashboard/);
  });

  test('secretary does NOT see Accounts section (not canManageAccounts)', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    expect(await hasSidebarSection(secretaryPage, 'Accounts')).toBe(false);
  });

  test('secretary sees Payments section (user version)', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    // Secretary is !canManageAccounts, so they see user Payments
    const paymentsBtn = secretaryPage.locator('nav button', { hasText: 'Payments' });
    if (await paymentsBtn.count() > 0) {
      await paymentsBtn.click();
      await secretaryPage.waitForTimeout(300);
      expect(await hasSidebarLink(secretaryPage, 'Maintenance')).toBe(true);
    }
  });

  test('secretary sees Society section (canManageSociety)', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    expect(await hasSidebarSection(secretaryPage, 'Society')).toBe(true);
  });

  test('secretary sees Helpdesk → complaint-management', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    const helpdesk = secretaryPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaint-management');
  });

  test('secretary sees full Facilities + Visitor Logs + Society Settings', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    await expandSection(secretaryPage, 'Facilities');
    expect(await hasSidebarLink(secretaryPage, 'Manage Amenities')).toBe(true);
    await secretaryPage.goto('/dashboard');
    await expandSection(secretaryPage, 'Visitors');
    expect(await hasSidebarLink(secretaryPage, 'Visitor Logs')).toBe(true);
    await secretaryPage.goto('/dashboard');
    await expandSection(secretaryPage, 'Settings');
    expect(await hasSidebarLink(secretaryPage, 'Society Settings')).toBe(true);
  });

  test('secretary does NOT see My Property section', async ({ secretaryPage }) => {
    await secretaryPage.goto('/dashboard');
    expect(await hasSidebarLink(secretaryPage, 'My Vehicles')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// ACCOUNTANT NAVIGATION
// ─────────────────────────────────────────────
test.describe('Accountant — Sidebar Navigation', () => {
  test('accountant sees Admin Dashboard (adminOnly route)', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    await expect(accountantPage).toHaveURL(/\/dashboard/);
  });

  test('accountant sees Accounts section (canManageAccounts)', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    expect(await hasSidebarSection(accountantPage, 'Accounts')).toBe(true);
    await expandSection(accountantPage, 'Accounts');
    expect(await hasSidebarLink(accountantPage, 'Income')).toBe(true);
    expect(await hasSidebarLink(accountantPage, 'Expenditure')).toBe(true);
    expect(await hasSidebarLink(accountantPage, 'Vendors')).toBe(true);
    expect(await hasSidebarLink(accountantPage, 'Receipts & Payments')).toBe(true);
  });

  test('accountant does NOT see Society section (not canManageSociety)', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    expect(await hasSidebarSection(accountantPage, 'Society')).toBe(false);
  });

  test('accountant sees Helpdesk → complaints (not complaint-management)', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    const helpdesk = accountantPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaints');
  });

  test('accountant sees limited Facilities (no Manage Amenities)', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    await expandSection(accountantPage, 'Facilities');
    expect(await hasSidebarLink(accountantPage, 'Book Facility')).toBe(true);
    expect(await hasSidebarLink(accountantPage, 'Manage Amenities')).toBe(false);
    expect(await hasSidebarLink(accountantPage, 'Reservation Requests')).toBe(false);
  });

  test('accountant sees Visitors with Pre-Approve + Daily Help', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    await expandSection(accountantPage, 'Visitors');
    expect(await hasSidebarLink(accountantPage, 'Pre-Approve')).toBe(true);
    expect(await hasSidebarLink(accountantPage, 'My Daily Help')).toBe(true);
  });

  test('accountant sees My Property section', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    const myPropBtn = accountantPage.locator('nav button', { hasText: /My/ });
    if (await myPropBtn.count() > 0) {
      await myPropBtn.first().click();
      await accountantPage.waitForTimeout(300);
      expect(await hasSidebarLink(accountantPage, 'Household')).toBe(true);
      expect(await hasSidebarLink(accountantPage, 'My Vehicles')).toBe(true);
    }
  });

  test('accountant does NOT see Society Settings', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    await expandSection(accountantPage, 'Settings');
    expect(await hasSidebarLink(accountantPage, 'Society Settings')).toBe(false);
    expect(await hasSidebarLink(accountantPage, 'User Settings')).toBe(true);
  });

  test('accountant can navigate to Accounts pages', async ({ accountantPage }) => {
    await accountantPage.goto('/dashboard');
    await expandSection(accountantPage, 'Accounts');
    await navigateViaMenu(accountantPage, 'Income', '/payments');
    await accountantPage.goto('/dashboard');
    await expandSection(accountantPage, 'Accounts');
    await navigateViaMenu(accountantPage, 'Expenditure', '/expenses');
  });
});

// ─────────────────────────────────────────────
// TREASURER NAVIGATION
// ─────────────────────────────────────────────
test.describe('Treasurer — Sidebar Navigation', () => {
  test('treasurer sees Accounts but NOT Society', async ({ treasurerPage }) => {
    await treasurerPage.goto('/dashboard');
    expect(await hasSidebarSection(treasurerPage, 'Accounts')).toBe(true);
    expect(await hasSidebarSection(treasurerPage, 'Society')).toBe(false);
  });

  test('treasurer sees Helpdesk → complaints', async ({ treasurerPage }) => {
    await treasurerPage.goto('/dashboard');
    const helpdesk = treasurerPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaints');
  });

  test('treasurer sees limited Facilities + Pre-Approve visitors', async ({ treasurerPage }) => {
    await treasurerPage.goto('/dashboard');
    await expandSection(treasurerPage, 'Facilities');
    expect(await hasSidebarLink(treasurerPage, 'Book Facility')).toBe(true);
    expect(await hasSidebarLink(treasurerPage, 'Manage Amenities')).toBe(false);
    await treasurerPage.goto('/dashboard');
    await expandSection(treasurerPage, 'Visitors');
    expect(await hasSidebarLink(treasurerPage, 'Pre-Approve')).toBe(true);
  });

  test('treasurer sees My Property section', async ({ treasurerPage }) => {
    await treasurerPage.goto('/dashboard');
    const myPropBtn = treasurerPage.locator('nav button', { hasText: /My/ });
    if (await myPropBtn.count() > 0) {
      await myPropBtn.first().click();
      await treasurerPage.waitForTimeout(300);
      expect(await hasSidebarLink(treasurerPage, 'My Vehicles')).toBe(true);
    }
  });

  test('treasurer does NOT see Society Settings', async ({ treasurerPage }) => {
    await treasurerPage.goto('/dashboard');
    await expandSection(treasurerPage, 'Settings');
    expect(await hasSidebarLink(treasurerPage, 'Society Settings')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// COMMITTEE MEMBER NAVIGATION
// ─────────────────────────────────────────────
test.describe('Committee Member — Sidebar Navigation', () => {
  test('committee member sees User Dashboard', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    await expect(committeePage).toHaveURL(/\/user-dashboard/);
    await expect(committeePage.locator('nav a', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('committee member does NOT see Accounts or Society sections', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    expect(await hasSidebarSection(committeePage, 'Accounts')).toBe(false);
    expect(await hasSidebarSection(committeePage, 'Society')).toBe(false);
  });

  test('committee member sees Payments section (user version)', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    const paymentsBtn = committeePage.locator('nav button', { hasText: 'Payments' });
    if (await paymentsBtn.count() > 0) {
      await paymentsBtn.click();
      await committeePage.waitForTimeout(300);
      expect(await hasSidebarLink(committeePage, 'Maintenance')).toBe(true);
      expect(await hasSidebarLink(committeePage, 'Membership')).toBe(true);
      expect(await hasSidebarLink(committeePage, 'Corpus Fund')).toBe(true);
    }
  });

  test('committee member sees Community', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    expect(await hasSidebarSection(committeePage, 'Community')).toBe(true);
  });

  test('committee member sees Helpdesk → complaints', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    const helpdesk = committeePage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaints');
  });

  test('committee member sees limited Facilities', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Facilities');
    expect(await hasSidebarLink(committeePage, 'Book Facility')).toBe(true);
    expect(await hasSidebarLink(committeePage, 'Manage Amenities')).toBe(false);
  });

  test('committee member sees Visitors with Pre-Approve + Daily Help', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Visitors');
    expect(await hasSidebarLink(committeePage, 'Pre-Approve')).toBe(true);
    expect(await hasSidebarLink(committeePage, 'My Daily Help')).toBe(true);
  });

  test('committee member sees My Property section', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    const myPropBtn = committeePage.locator('nav button', { hasText: /My/ });
    if (await myPropBtn.count() > 0) {
      await myPropBtn.first().click();
      await committeePage.waitForTimeout(300);
      expect(await hasSidebarLink(committeePage, 'Household')).toBe(true);
      expect(await hasSidebarLink(committeePage, 'My Vehicles')).toBe(true);
    }
  });

  test('committee member does NOT see Society Settings', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Settings');
    expect(await hasSidebarLink(committeePage, 'Society Settings')).toBe(false);
  });

  test('committee member can navigate to community pages', async ({ committeePage }) => {
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Community');
    await navigateViaMenu(committeePage, 'Notice Board', '/notices');
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Community');
    await navigateViaMenu(committeePage, 'Discussion Forum', '/forum');
    await committeePage.goto('/user-dashboard');
    await expandSection(committeePage, 'Community');
    await navigateViaMenu(committeePage, 'Events', '/events');
  });
});

// ─────────────────────────────────────────────
// RESIDENT NAVIGATION
// ─────────────────────────────────────────────
test.describe('Resident — Sidebar Navigation', () => {
  test('resident sees User Dashboard', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    await expect(residentPage).toHaveURL(/\/user-dashboard/);
  });

  test('resident sees Payments (user version) not Accounts', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    expect(await hasSidebarSection(residentPage, 'Accounts')).toBe(false);
    const paymentsBtn = residentPage.locator('nav button', { hasText: 'Payments' });
    expect(await paymentsBtn.count()).toBeGreaterThan(0);
    await paymentsBtn.click();
    await residentPage.waitForTimeout(300);
    expect(await hasSidebarLink(residentPage, 'Maintenance')).toBe(true);
    expect(await hasSidebarLink(residentPage, 'Membership')).toBe(true);
    expect(await hasSidebarLink(residentPage, 'Corpus Fund')).toBe(true);
  });

  test('resident does NOT see Society section', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    expect(await hasSidebarSection(residentPage, 'Society')).toBe(false);
  });

  test('resident sees Community + Helpdesk (complaints)', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    expect(await hasSidebarSection(residentPage, 'Community')).toBe(true);
    const helpdesk = residentPage.locator('nav a', { hasText: 'Helpdesk' });
    await expect(helpdesk).toHaveAttribute('href', '/complaints');
  });

  test('resident sees limited Facilities', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    await expandSection(residentPage, 'Facilities');
    expect(await hasSidebarLink(residentPage, 'Book Facility')).toBe(true);
    expect(await hasSidebarLink(residentPage, 'Manage Amenities')).toBe(false);
    expect(await hasSidebarLink(residentPage, 'Reservation Requests')).toBe(false);
  });

  test('resident sees Visitors with Pre-Approve + Daily Help', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    await expandSection(residentPage, 'Visitors');
    expect(await hasSidebarLink(residentPage, 'Pre-Approve')).toBe(true);
    expect(await hasSidebarLink(residentPage, 'My Daily Help')).toBe(true);
  });

  test('resident sees My Property section', async ({ residentPage }) => {
    await residentPage.goto('/user-dashboard');
    const myPropBtn = residentPage.locator('nav button', { hasText: /My/ });
    if (await myPropBtn.count() > 0) {
      await myPropBtn.first().click();
      await residentPage.waitForTimeout(300);
      expect(await hasSidebarLink(residentPage, 'Household')).toBe(true);
      expect(await hasSidebarLink(residentPage, 'My Vehicles')).toBe(true);
    }
  });

  test('resident can navigate to all visible pages', async ({ residentPage }) => {
    // Payments
    await residentPage.goto('/user-dashboard');
    const paymentsBtn = residentPage.locator('nav button', { hasText: 'Payments' });
    await paymentsBtn.click();
    await residentPage.waitForTimeout(300);
    await navigateViaMenu(residentPage, 'Maintenance', '/pay-maintenance');

    // Community
    await residentPage.goto('/user-dashboard');
    await expandSection(residentPage, 'Community');
    await navigateViaMenu(residentPage, 'Notice Board', '/notices');
    await residentPage.goto('/user-dashboard');
    await expandSection(residentPage, 'Community');
    await navigateViaMenu(residentPage, 'Polls & Voting', '/polls');

    // Helpdesk
    await residentPage.goto('/user-dashboard');
    await residentPage.locator('nav a', { hasText: 'Helpdesk' }).click();
    await residentPage.waitForURL(/\/complaints/, { timeout: 10000 });

    // Facilities
    await residentPage.goto('/user-dashboard');
    await expandSection(residentPage, 'Facilities');
    await navigateViaMenu(residentPage, 'Book Facility', '/bookings');
  });
});
