/**
 * Shared Playwright fixtures.
 * Provides pre-authenticated pages and API clients for each role.
 */
const { test: base, expect } = require('@playwright/test');
const { contextForRole } = require('./auth');
const { apiAs, getToken, TEST_USERS } = require('./test-data');
const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', '.auth', 'seed-ids.json');

function loadSeedIds() {
  if (!fs.existsSync(SEED_FILE)) return {};
  return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
}

/**
 * Extended test fixture that provides:
 *  - adminPage, residentPage, guardPage, etc. (pre-authenticated browser pages)
 *  - adminAPI, residentAPI, guardAPI, etc. (direct HTTP clients)
 *  - seedIds (IDs from global setup)
 */
const test = base.extend({
  seedIds: async ({}, use) => {
    await use(loadSeedIds());
  },

  // Pre-authenticated pages
  adminPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'admin');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  residentPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'resident');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  resident2Page: async ({ browser }, use) => {
    // resident2 shares resident state for login, but we need a separate login
    // For simplicity we reuse the resident context since resident2 tests are API-level
    const ctx = await contextForRole(browser, 'resident');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  guardPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'guard');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  accountantPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'accountant');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  presidentPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'president');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  secretaryPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'secretary');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  treasurerPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'treasurer');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  committeePage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'committee');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },

  // API clients
  adminAPI:      async ({}, use) => { await use(apiAs('admin')); },
  residentAPI:   async ({}, use) => { await use(apiAs('resident')); },
  resident2API:  async ({}, use) => { await use(apiAs('resident2')); },
  guardAPI:      async ({}, use) => { await use(apiAs('guard')); },
  accountantAPI: async ({}, use) => { await use(apiAs('accountant')); },
  presidentAPI:  async ({}, use) => { await use(apiAs('president')); },
  secretaryAPI:  async ({}, use) => { await use(apiAs('secretary')); },
  treasurerAPI:  async ({}, use) => { await use(apiAs('treasurer')); },
  committeeAPI:  async ({}, use) => { await use(apiAs('committee')); },

  // Multi-role combo API clients
  guardAdminAPI:          async ({}, use) => { await use(apiAs('guard_admin')); },
  presidentSecretaryAPI:  async ({}, use) => { await use(apiAs('president_secretary')); },
  treasurerAccountantAPI: async ({}, use) => { await use(apiAs('treasurer_accountant')); },
  guardResidentAPI:       async ({}, use) => { await use(apiAs('guard_resident')); },
  presidentTreasurerAPI:  async ({}, use) => { await use(apiAs('president_treasurer')); },

  // Multi-role combo pages
  guardAdminPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'guard_admin');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  presidentSecretaryPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'president_secretary');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
  guardResidentPage: async ({ browser }, use) => {
    const ctx = await contextForRole(browser, 'guard_resident');
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

module.exports = { test, expect };
