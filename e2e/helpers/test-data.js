/**
 * Test data constants and seeding helpers.
 *
 * All test entities use a "E2E_" prefix so they can be identified and
 * left in the DB for post-run validation (per requirements).
 */
const { client, login, request } = require('./api-client');

// ── Test user definitions (one per role) ──────────────────────────────
const TEST_USERS = {
  admin:    { username: 'admin', password: 'welcome' }, // seeded by DataInitializer
  guard: {
    username: 'e2e_guard', password: 'welcome', firstName: 'E2E', lastName: 'Guard',
    email: 'e2e_guard@test.com', phone: '+91-9100000020', unitNumber: 'GATE-1',
    roles: ['GUARD'],
  },
  resident: {
    username: 'e2e_resident', password: 'welcome', firstName: 'E2E', lastName: 'Resident',
    email: 'e2e_resident@test.com', phone: '+91-9100000001', unitNumber: 'A-101',
    roles: ['RESIDENT'],
  },
  resident2: {
    username: 'e2e_resident2', password: 'welcome', firstName: 'E2E', lastName: 'Resident2',
    email: 'e2e_resident2@test.com', phone: '+91-9100000002', unitNumber: 'A-102',
    roles: ['RESIDENT'],
  },
  accountant: {
    username: 'e2e_accountant', password: 'welcome', firstName: 'E2E', lastName: 'Accountant',
    email: 'e2e_accountant@test.com', phone: '+91-9100000003', unitNumber: 'A-103',
    roles: ['RESIDENT', 'ACCOUNTANT'],
  },
  president: {
    username: 'e2e_president', password: 'welcome', firstName: 'E2E', lastName: 'President',
    email: 'e2e_president@test.com', phone: '+91-9100000004', unitNumber: 'A-104',
    roles: ['RESIDENT', 'PRESIDENT'],
  },
  secretary: {
    username: 'e2e_secretary', password: 'welcome', firstName: 'E2E', lastName: 'Secretary',
    email: 'e2e_secretary@test.com', phone: '+91-9100000005', unitNumber: 'A-105',
    roles: ['RESIDENT', 'SECRETARY'],
  },
  treasurer: {
    username: 'e2e_treasurer', password: 'welcome', firstName: 'E2E', lastName: 'Treasurer',
    email: 'e2e_treasurer@test.com', phone: '+91-9100000006', unitNumber: 'A-106',
    roles: ['RESIDENT', 'TREASURER'],
  },
  committee: {
    username: 'e2e_committee', password: 'welcome', firstName: 'E2E', lastName: 'Committee',
    email: 'e2e_committee@test.com', phone: '+91-9100000007', unitNumber: 'A-107',
    roles: ['RESIDENT', 'COMMITTEE_MEMBER'],
  },
  // ── Multi-role combo users ──
  guard_admin: {
    username: 'e2e_guard_admin', password: 'welcome', firstName: 'E2E', lastName: 'GuardAdmin',
    email: 'e2e_guard_admin@test.com', phone: '+91-9100000008', unitNumber: 'A-108',
    roles: ['GUARD', 'ADMIN'],
  },
  president_secretary: {
    username: 'e2e_pres_sec', password: 'welcome', firstName: 'E2E', lastName: 'PresSec',
    email: 'e2e_pres_sec@test.com', phone: '+91-9100000009', unitNumber: 'A-109',
    roles: ['RESIDENT', 'PRESIDENT', 'SECRETARY'],
  },
  treasurer_accountant: {
    username: 'e2e_treas_acct', password: 'welcome', firstName: 'E2E', lastName: 'TreasAcct',
    email: 'e2e_treas_acct@test.com', phone: '+91-9100000010', unitNumber: 'A-110',
    roles: ['RESIDENT', 'TREASURER', 'ACCOUNTANT'],
  },
  guard_resident: {
    username: 'e2e_guard_res', password: 'welcome', firstName: 'E2E', lastName: 'GuardRes',
    email: 'e2e_guard_res@test.com', phone: '+91-9100000011', unitNumber: 'A-111',
    roles: ['GUARD', 'RESIDENT'],
  },
  president_treasurer: {
    username: 'e2e_pres_treas', password: 'welcome', firstName: 'E2E', lastName: 'PresTreas',
    email: 'e2e_pres_treas@test.com', phone: '+91-9100000012', unitNumber: 'A-112',
    roles: ['RESIDENT', 'PRESIDENT', 'TREASURER'],
  },
};

// ── Tokens cache ──────────────────────────────────────────────────────
const tokens = {};

async function getToken(role) {
  if (tokens[role]) return tokens[role];
  const user = TEST_USERS[role];
  if (!user) throw new Error(`Unknown test role: ${role}`);
  const { token } = await login(user.username, user.password);
  tokens[role] = token;
  return token;
}

function apiAs(role) {
  return {
    async get(path, opts) { return client(await getToken(role)).get(path, opts); },
    async post(path, body, opts) { return client(await getToken(role)).post(path, body, opts); },
    async put(path, body, opts) { return client(await getToken(role)).put(path, body, opts); },
    async delete(path, opts) { return client(await getToken(role)).delete(path, opts); },
  };
}

// ── Seeding ───────────────────────────────────────────────────────────

async function seedTestUsers() {
  const adminToken = (await login('admin', 'welcome')).token;
  const api = client(adminToken);

  // Fetch existing users to avoid duplicates
  const { data: existing } = await api.get('/admin/users');
  const existingUsernames = new Set(existing.map(u => u.username));

  const created = {};
  for (const [role, user] of Object.entries(TEST_USERS)) {
    if (role === 'admin') continue; // already seeded by DataInitializer

    if (existingUsernames.has(user.username)) {
      const found = existing.find(u => u.username === user.username);
      created[role] = found.id;
      // Try to login — if it works, password is already set
      try {
        await login(user.username, user.password);
      } catch {
        // Can't login — use admin reset-password endpoint to set known password
        await api.put(`/admin/users/${found.id}/reset-password`, { newPassword: user.password });
      }
      continue;
    }

    // Create user — backend returns a password reset link with token
    const { data } = await api.post('/admin/users', {
      username: user.username, firstName: user.firstName, lastName: user.lastName,
      email: user.email, phone: user.phone, unitNumber: user.unitNumber,
      roles: user.roles,
    }, { expectStatus: 200 });

    created[role] = data.id;

    // Extract the reset token from the passwordResetLink
    const resetLink = data.passwordResetLink || '';
    const tokenMatch = resetLink.match(/token=([^&]+)/);
    if (tokenMatch) {
      // Use the reset token to set password to 'welcome'
      await request('POST', '/auth/reset-password', {
        body: { token: tokenMatch[1], newPassword: user.password },
        expectStatus: 200,
      });
    }
  }
  return created;
}

async function seedTestProperty() {
  const api = apiAs('admin');
  const { data: props } = await api.get('/admin/properties');
  const existing = props.find(p => p.unitNumber === 'A-101');
  if (existing) return existing.id;

  const { data } = await api.post('/admin/properties', {
    unitNumber: 'A-101', ownerName: 'E2E Resident', type: 'APARTMENT',
    floorNumber: 1, area: 1200, status: 'OCCUPIED',
  });
  return data.id;
}

async function seedTestNotice() {
  const api = apiAs('admin');
  const { data: notices } = await api.get('/admin/notices');
  const existing = notices.find(n => n.title?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/notices', {
    title: 'E2E_Test Notice', content: 'This is an automated test notice.',
    category: 'GENERAL', priority: 'MEDIUM',
  });
  return data.id;
}

async function seedTestAmenity() {
  const api = apiAs('admin');
  const { data: amenities } = await api.get('/admin/amenities');
  const existing = amenities.find(a => a.name?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/amenities', {
    name: 'E2E_Club House', description: 'Test amenity', chargePerDay: 500,
    available: true, maxCapacity: 50,
  });
  return data.id;
}

async function seedTestVendor() {
  const api = apiAs('admin');
  const { data: vendors } = await api.get('/admin/vendors');
  const existing = vendors.find(v => v.name?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/vendors', {
    name: 'E2E_Test Vendor', category: 'CLEANING', phone: '+91-9200000001',
    email: 'e2e_vendor@test.com', active: true, vendorType: 'OTHER',
  });
  return data.id;
}

async function seedTestPoll() {
  const api = apiAs('admin');
  const { data: polls } = await api.get('/admin/polls');
  const existing = polls.find(p => p.question?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/polls', {
    question: 'E2E_Should we add a gym?',
    options: ['Yes', 'No', 'Maybe'],
    active: true,
  });
  return data.id;
}

async function seedTestEvent() {
  const api = apiAs('admin');
  const { data: events } = await api.get('/admin/events');
  const existing = events.find(e => e.title?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/events', {
    title: 'E2E_Community Gathering', description: 'Test event',
    eventDate: '2026-06-01', eventTime: '18:00', location: 'Club House',
    maxAttendees: 100,
  });
  return data.id;
}

async function seedTestEmergencyContact() {
  const api = apiAs('admin');
  const { data: contacts } = await api.get('/admin/emergency-contacts');
  const existing = contacts.find(c => c.name?.startsWith('E2E_'));
  if (existing) return existing.id;

  const { data } = await api.post('/admin/emergency-contacts', {
    name: 'E2E_Fire Department', phone: '101', type: 'FIRE',
  });
  return data.id;
}

async function seedIncomeTypes() {
  const api = apiAs('admin');
  const { data: existing } = await api.get('/admin/income-types');
  const existingCodes = new Set(existing.map(t => t.code));

  const types = [
    { code: 'MAINTENANCE', displayName: 'Maintenance', gstApplicable: true, reserveFund: false, oneTime: false, displayOrder: 1 },
    { code: 'CORPUS', displayName: 'Corpus Fund', gstApplicable: true, reserveFund: true, oneTime: true, displayOrder: 2 },
    { code: 'MEMBERSHIP', displayName: 'Membership', gstApplicable: false, reserveFund: true, oneTime: true, displayOrder: 3 },
    { code: 'AMENITY_BOOKING', displayName: 'Amenity Booking', gstApplicable: true, reserveFund: false, oneTime: false, systemManaged: true, displayOrder: 4 },
  ];
  for (const t of types) {
    if (!existingCodes.has(t.code)) {
      await api.post('/admin/income-types', t);
    }
  }
}

async function seedExpenseTypes() {
  const api = apiAs('admin');
  const { data: existing } = await api.get('/admin/expense-types');
  const existingCodes = new Set(existing.map(t => t.code));

  const types = [
    { code: 'ELECTRICITY', displayName: 'Electricity', gstIncluded: true, displayOrder: 1 },
    { code: 'WATER', displayName: 'Water', gstIncluded: true, displayOrder: 2 },
    { code: 'SECURITY', displayName: 'Security', gstIncluded: true, displayOrder: 3 },
    { code: 'MAINTENANCE', displayName: 'Maintenance', gstIncluded: true, displayOrder: 4 },
    { code: 'SALARY', displayName: 'Salary', gstIncluded: false, displayOrder: 5 },
    { code: 'CLEANING', displayName: 'Cleaning', gstIncluded: true, displayOrder: 6 },
    { code: 'GARDENING', displayName: 'Gardening', gstIncluded: true, displayOrder: 7 },
    { code: 'REPAIRS', displayName: 'Repairs', gstIncluded: true, displayOrder: 8 },
    { code: 'OTHER', displayName: 'Other', gstIncluded: true, displayOrder: 9 },
  ];
  for (const t of types) {
    if (!existingCodes.has(t.code)) {
      await api.post('/admin/expense-types', t);
    }
  }
}

/** Master seed — call once in global setup. Returns all created IDs. */
async function seedAll() {
  const userIds = await seedTestUsers();
  // Seed config types before other data (payments/expenses depend on them)
  await seedIncomeTypes();
  await seedExpenseTypes();
  const [propertyId, noticeId, amenityId, vendorId, pollId, eventId, emergencyContactId] =
    await Promise.all([
      seedTestProperty(),
      seedTestNotice(),
      seedTestAmenity(),
      seedTestVendor(),
      seedTestPoll(),
      seedTestEvent(),
      seedTestEmergencyContact(),
    ]);

  return { userIds, propertyId, noticeId, amenityId, vendorId, pollId, eventId, emergencyContactId };
}

module.exports = {
  TEST_USERS, getToken, apiAs, seedAll,
  seedTestUsers, seedTestProperty, seedTestNotice, seedTestAmenity,
  seedTestVendor, seedTestPoll, seedTestEvent, seedTestEmergencyContact,
  seedIncomeTypes, seedExpenseTypes,
};
