/**
 * Global setup — runs before all test suites.
 * Seeds test data and saves auth state for each role.
 */
const { test } = require('@playwright/test');
const { seedAll } = require('../helpers/test-data');
const { loginAndSaveState } = require('../helpers/auth');
const { TEST_USERS } = require('../helpers/test-data');
const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, '..', '.auth', 'seed-ids.json');

test('seed test data via API', async () => {
  const ids = await seedAll();
  // persist IDs so tests can reference them
  const dir = path.dirname(SEED_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SEED_FILE, JSON.stringify(ids, null, 2));
  console.log('Seeded test data:', JSON.stringify(ids, null, 2));
});

// Save browser auth state for each role we need to test via UI
const UI_ROLES = ['admin', 'guard', 'resident', 'accountant', 'president', 'secretary', 'treasurer', 'committee',
  'guard_admin', 'president_secretary', 'treasurer_accountant', 'guard_resident', 'president_treasurer'];

for (const role of UI_ROLES) {
  test(`save auth state for ${role}`, async ({ page }) => {
    const user = TEST_USERS[role];
    await loginAndSaveState(page, user.username, role, user.password);
  });
}
