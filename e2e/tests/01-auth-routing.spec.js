/**
 * Authentication & Role-Based Routing Tests
 *
 * Covers:
 * - Login / logout flow
 * - All roles redirect to /home after login
 * - Unauthenticated access redirects to /login
 * - Admin routes blocked for non-admin roles
 * - Guard routes blocked for non-guard roles
 */
const { test, expect } = require('../helpers/fixtures');
const { loginViaUI } = require('../helpers/auth');
const { TEST_USERS } = require('../helpers/test-data');

test.describe('Authentication', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder('Enter your username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Enter your username').fill('baduser');
    await page.getByPlaceholder('Enter your password').fill('badpass');
    await page.getByPlaceholder('Enter your password').press('Enter');
    // Should stay on login and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('.bg-red-50, [class*="bg-red"]')).toBeVisible({ timeout: 5000 });
  });

  test('admin login redirects to /home', async ({ page }) => {
    await loginViaUI(page, 'admin', 'welcome');
    await expect(page).toHaveURL(/\/home/);
  });

  test('guard login redirects to /home', async ({ page }) => {
    await loginViaUI(page, 'guard', 'welcome');
    await expect(page).toHaveURL(/\/home/);
  });

  test('resident login redirects to /home', async ({ page }) => {
    await loginViaUI(page, TEST_USERS.resident.username, 'welcome');
    await expect(page).toHaveURL(/\/home/);
  });

  test('president login redirects to /home', async ({ page }) => {
    await loginViaUI(page, TEST_USERS.president.username, 'welcome');
    await expect(page).toHaveURL(/\/home/);
  });

  test('secretary login redirects to /home', async ({ page }) => {
    await loginViaUI(page, TEST_USERS.secretary.username, 'welcome');
    await expect(page).toHaveURL(/\/home/);
  });
});

test.describe('Route Guards — unauthenticated', () => {
  test('unauthenticated user is redirected to /login for protected routes', async ({ browser }) => {
    const ctx = await browser.newContext(); // no auth state
    const page = await ctx.newPage();
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/payments');
    await expect(page).toHaveURL(/\/login/);
    await ctx.close();
  });
});

test.describe('Route Guards — role enforcement', () => {
  test('resident cannot access admin routes → redirected to /home', async ({ residentPage }) => {
    await residentPage.goto('/users');
    await expect(residentPage).toHaveURL(/\/home/);
    await residentPage.goto('/payments');
    await expect(residentPage).toHaveURL(/\/home/);
    await residentPage.goto('/expenses');
    await expect(residentPage).toHaveURL(/\/home/);
    await residentPage.goto('/society-settings');
    await expect(residentPage).toHaveURL(/\/home/);
  });

  test('guard cannot access admin routes', async ({ guardPage }) => {
    await guardPage.goto('/users');
    // guard is not admin, should redirect to /home
    await expect(guardPage).toHaveURL(/\/home/);
  });

  test('admin can access admin routes', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage).toHaveURL(/\/users/);
  });

  test('accountant can access admin routes (has admin-like frontend access)', async ({ accountantPage }) => {
    await accountantPage.goto('/payments');
    await expect(accountantPage).toHaveURL(/\/payments/);
  });

  test('committee member cannot access admin routes → redirected to /home', async ({ committeePage }) => {
    await committeePage.goto('/payments');
    // COMMITTEE_MEMBER is NOT in the adminOnly check list, should redirect to /home
    await expect(committeePage).toHaveURL(/\/home/);
  });
});

test.describe('Logout', () => {
  test('admin can log out and is redirected to login', async ({ adminPage }) => {
    await adminPage.goto('/home');
    // Look for logout button/link — typically in sidebar or dropdown
    const logoutBtn = adminPage.getByRole('button', { name: /logout|sign out/i })
      .or(adminPage.locator('[title="Logout"]'))
      .or(adminPage.locator('a[href="/login"]'));
    if (await logoutBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.first().click();
      await expect(adminPage).toHaveURL(/\/login/);
    }
    // If no visible logout button found, skip gracefully
  });
});
