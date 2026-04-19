/**
 * Browser-level authentication helpers.
 * Logs in via the UI and stores auth state for reuse.
 */
const fs = require('fs');
const path = require('path');

const AUTH_DIR = path.join(__dirname, '..', '.auth');

function storageStatePath(role) {
  return path.join(AUTH_DIR, `${role.toLowerCase()}.json`);
}

/**
 * Log in through the browser UI and save storage state.
 */
async function loginViaUI(page, username, password = 'welcome') {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  // Wait for the form inputs to be visible (don't use networkidle — Vite HMR keeps the connection alive)
  const usernameInput = page.getByPlaceholder('Enter your username');
  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
  await usernameInput.fill(username);
  await page.getByPlaceholder('Enter your password').fill(password);
  // Submit via Enter key on the password field — avoids button DOM detachment from HMR
  await page.getByPlaceholder('Enter your password').press('Enter');
  // Wait for redirect away from login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
}

/**
 * Log in and save browser storage state to a file for the given role.
 */
async function loginAndSaveState(page, username, role, password = 'welcome') {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  await loginViaUI(page, username, password);
  await page.context().storageState({ path: storageStatePath(role) });
}

/**
 * Create a new browser context with saved auth state for a role.
 */
async function contextForRole(browser, role) {
  const statePath = storageStatePath(role);
  if (!fs.existsSync(statePath)) {
    throw new Error(`No saved auth state for role "${role}". Run setup first.`);
  }
  return browser.newContext({ storageState: statePath });
}

module.exports = { loginViaUI, loginAndSaveState, contextForRole, storageStatePath };
