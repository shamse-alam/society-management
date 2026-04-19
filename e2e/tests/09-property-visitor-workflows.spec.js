/**
 * 09-property-visitor-workflows.spec.js
 * Comprehensive tests for: visitors, daily help, deliveries, vehicles, parking,
 * households, move requests, amenity bookings, and guard workflows.
 */
const { test, expect } = require('../helpers/fixtures');

// ─────────────────────────────────────────────
// VISITOR PRE-APPROVAL & GUARD WORKFLOW
// ─────────────────────────────────────────────
test.describe('Visitor Management', () => {
  test('resident can pre-approve a visitor', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/visitors/pre-approve', {
      visitorName: 'E2E_John Friend', visitorPhone: '+91-9888000001',
      visitorType: 'GUEST', purpose: 'Personal visit',
      expectedAt: '2026-04-25T10:00:00',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view own visitor approvals', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/visitors/my-approvals');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can view expected visitors', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/expected');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can view visitors currently inside', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/inside');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can view awaiting approval', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/awaiting-approval');
    expect(res.status).toBe(200);
  });

  test('guard can view stats', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/stats');
    expect(res.status).toBe(200);
  });

  test('admin can view visitor logs', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/visitors');
    expect(res.status).toBe(200);
  });

  test('admin can view visitor stats', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/visitors/stats');
    expect(res.status).toBe(200);
  });

  test('visitor pre-approve page renders', async ({ residentPage }) => {
    await residentPage.goto('/visitors');
    await expect(residentPage).toHaveURL(/\/visitors/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('visitor logs page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/visitor-logs');
    await expect(adminPage).toHaveURL(/\/visitor-logs/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('guard home page renders', async ({ guardPage }) => {
    await guardPage.goto('/home');
    await expect(guardPage).toHaveURL(/\/home/);
    await guardPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// DAILY HELP
// ─────────────────────────────────────────────
test.describe('Daily Help', () => {
  test('resident can register daily help', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/daily-help', {
      name: 'E2E_Ramu Helper', phone: '+91-9111000001', type: 'MAID',
    });
    expect([200, 400]).toContain(res.status); // 400 if already exists
  });

  test('resident can view own daily help', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/daily-help');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can view daily help entries', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/daily-help');
    expect(res.status).toBe(200);
  });

  test('daily help page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/daily-help');
    await expect(residentPage).toHaveURL(/\/daily-help/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// DELIVERIES
// ─────────────────────────────────────────────
test.describe('Deliveries', () => {
  test('guard can log a delivery', async ({ guardAPI }) => {
    // Use A-101 which is the known unit with a resident user
    const res = await guardAPI.post('/guard/deliveries', {
      unitNumber: 'A-101', deliveryService: 'E2E Courier', description: 'E2E Test Package',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('guard can view pending deliveries', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/deliveries/pending');
    expect(res.status).toBe(200);
  });

  test('resident can view own deliveries', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/deliveries');
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// VEHICLES
// ─────────────────────────────────────────────
test.describe('Vehicle Management', () => {
  test('resident can add a vehicle', async ({ residentAPI }) => {
    const { data: vehicles } = await residentAPI.get('/user/vehicles');
    if (vehicles.find(v => v.vehicleNumber === 'E2E-KA01-1234')) return;

    const res = await residentAPI.post('/user/vehicles', {
      vehicleNumber: 'E2E-KA01-1234', type: 'CAR', make: 'Hyundai',
      model: 'Creta', color: 'White',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view own vehicles', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/vehicles');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('guard can verify a vehicle number', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/vehicles/verify/E2E-KA01-1234');
    expect([200, 404]).toContain(res.status);
  });

  test('admin can view all vehicles', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/vehicles');
    expect(res.status).toBe(200);
  });

  test('my vehicles page renders', async ({ residentPage }) => {
    await residentPage.goto('/my-vehicles');
    await expect(residentPage).toHaveURL(/\/my-vehicles/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('admin vehicles page renders', async ({ adminPage }) => {
    await adminPage.goto('/vehicles');
    await expect(adminPage).toHaveURL(/\/vehicles/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// PARKING
// ─────────────────────────────────────────────
test.describe('Parking Management', () => {
  test('admin can create a parking slot', async ({ adminAPI }) => {
    const { data: slots } = await adminAPI.get('/admin/parking-slots');
    if (slots.find(s => s.slotNumber === 'E2E-P01')) return;

    const res = await adminAPI.post('/admin/parking-slots', {
      slotNumber: 'E2E-P01', slotType: 'CAR', zone: 'B1',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('admin can view all parking slots', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/parking-slots');
    expect(res.status).toBe(200);
  });

  test('admin can view available slots', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/parking-slots/available');
    expect(res.status).toBe(200);
  });

  test('parking page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/parking');
    await expect(adminPage).toHaveURL(/\/parking/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  // Visitor parking
  test('guard can view available visitor parking slots', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/visitor-parking/slots');
    expect(res.status).toBe(200);
  });

  test('admin can view visitor parking', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/visitor-parking');
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// HOUSEHOLD MEMBERS
// ─────────────────────────────────────────────
test.describe('Household Members', () => {
  test('resident can add a family member', async ({ residentAPI }) => {
    const { data: members } = await residentAPI.get('/user/family-members');
    if (members.find(m => m.name === 'E2E Spouse')) return;

    const res = await residentAPI.post('/user/family-members', {
      name: 'E2E Spouse', relation: 'SPOUSE', phone: '+91-9111000002',
      dateOfBirth: '1990-05-15',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view family members', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/family-members');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('admin can view all family members', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/family-members');
    expect(res.status).toBe(200);
  });

  test('household page renders', async ({ residentPage }) => {
    await residentPage.goto('/household');
    await expect(residentPage).toHaveURL(/\/household/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('admin household page renders', async ({ adminPage }) => {
    await adminPage.goto('/household');
    await expect(adminPage).toHaveURL(/\/household/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// MOVE REQUESTS
// ─────────────────────────────────────────────
test.describe('Move Requests', () => {
  test('resident can create a move request', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/move-requests', {
      moveType: 'MOVE_IN', scheduledDate: '2026-05-01',
      notes: 'E2E Moving furniture in',
    });
    expect([200, 201]).toContain(res.status);
  });

  test('resident can view own move requests', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/move-requests');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('admin can view all move requests', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/move-requests');
    expect(res.status).toBe(200);
  });

  test('admin can approve a move request', async ({ adminAPI }) => {
    const { data: requests } = await adminAPI.get('/admin/move-requests');
    const pending = requests.find(r => r.status === 'PENDING' && r.notes?.startsWith('E2E'));
    if (!pending) return;

    const res = await adminAPI.put(`/admin/move-requests/${pending.id}/approve`, {
      adminRemarks: 'E2E Approved for May 1',
    });
    expect(res.status).toBe(200);
  });

  test('my move requests page renders', async ({ residentPage }) => {
    await residentPage.goto('/my-move-requests');
    await expect(residentPage).toHaveURL(/\/my-move-requests/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('admin move requests page renders', async ({ adminPage }) => {
    await adminPage.goto('/move-requests');
    await expect(adminPage).toHaveURL(/\/move-requests/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// AMENITY BOOKINGS
// ─────────────────────────────────────────────
test.describe('Amenity Bookings', () => {
  test('admin can view amenities', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/amenities');
    expect(res.status).toBe(200);
  });

  test('resident can view amenities', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/amenities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('resident can create an amenity booking', async ({ residentAPI }) => {
    const { data: amenities } = await residentAPI.get('/user/amenities');
    const amenity = amenities.find(a => a.name?.startsWith('E2E_'));
    if (!amenity) return;

    // Use a date far in the future to avoid collisions with prior test runs
    const futureDate = '2027-01-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const res = await residentAPI.post('/user/bookings', {
      amenityId: amenity.id, bookingDate: futureDate,
      bookingEndDate: futureDate, purpose: 'E2E Birthday party',
    });
    // 400 can happen if no units available (capacity limit from prior runs)
    expect([200, 201, 400]).toContain(res.status);
  });

  test('resident can view own bookings', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/bookings');
    expect(res.status).toBe(200);
  });

  test('admin can view all bookings', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/bookings');
    expect(res.status).toBe(200);
  });

  test('bookings page renders', async ({ residentPage }) => {
    await residentPage.goto('/bookings');
    await expect(residentPage).toHaveURL(/\/bookings/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('amenity management page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/amenities');
    await expect(adminPage).toHaveURL(/\/amenities/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('booking requests page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/booking-requests');
    await expect(adminPage).toHaveURL(/\/booking-requests/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// PROPERTIES
// ─────────────────────────────────────────────
test.describe('Property Management', () => {
  test('admin can view properties', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/properties');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('admin can create a property', async ({ adminAPI }) => {
    const { data: props } = await adminAPI.get('/admin/properties');
    if (props.find(p => p.unitNumber === 'E2E-B-201')) return;

    const res = await adminAPI.post('/admin/properties', {
      unitNumber: 'E2E-B-201', ownerName: 'E2E Test Owner', type: 'APARTMENT',
      floorNumber: 2, area: 1500, status: 'OCCUPIED',
    });
    expect(res.status).toBe(200);
  });

  test('guard can view properties (read-only)', async ({ guardAPI }) => {
    const res = await guardAPI.get('/guard/properties');
    expect(res.status).toBe(200);
  });

  test('properties page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/properties');
    await expect(adminPage).toHaveURL(/\/properties/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────
test.describe('User Management', () => {
  test('admin can view all users', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/users');
    expect(res.status).toBe(200);
    expect(res.data.length).toBeGreaterThan(0);
  });

  test('admin can view a user detail', async ({ adminAPI }) => {
    const { data: users } = await adminAPI.get('/admin/users');
    const user = users[0];

    const res = await adminAPI.get(`/admin/users/${user.id}`);
    expect(res.status).toBe(200);
    expect(res.data.id).toBe(user.id);
  });

  test('users page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/users');
    await expect(adminPage).toHaveURL(/\/users/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('user detail page renders', async ({ adminAPI, adminPage }) => {
    const { data: users } = await adminAPI.get('/admin/users');
    const user = users[0];
    await adminPage.goto(`/users/${user.id}`);
    await expect(adminPage).toHaveURL(new RegExp(`/users/${user.id}`));
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// PROFILE & SETTINGS
// ─────────────────────────────────────────────
test.describe('Profile & Settings', () => {
  test('resident can view own profile', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/profile');
    expect(res.status).toBe(200);
    expect(res.data.username).toBe('e2e_resident');
  });

  test('resident can update profile', async ({ residentAPI }) => {
    const res = await residentAPI.put('/user/profile', {
      phone: '+91-9100000099',
    });
    expect(res.status).toBe(200);
  });

  test('my profile page renders', async ({ residentPage }) => {
    await residentPage.goto('/my-profile');
    await expect(residentPage).toHaveURL(/\/my-profile/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('settings page renders', async ({ residentPage }) => {
    await residentPage.goto('/settings');
    await expect(residentPage).toHaveURL(/\/settings/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('society settings page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/society-settings');
    await expect(adminPage).toHaveURL(/\/society-settings/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// PAYMENT PAGES (RESIDENT)
// ─────────────────────────────────────────────
test.describe('Resident Payment Pages', () => {
  test('pay maintenance page renders', async ({ residentPage }) => {
    await residentPage.goto('/pay-maintenance');
    await expect(residentPage).toHaveURL(/\/pay-maintenance/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('pay membership page renders', async ({ residentPage }) => {
    await residentPage.goto('/pay-membership');
    await expect(residentPage).toHaveURL(/\/pay-membership/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('pay corpus page renders', async ({ residentPage }) => {
    await residentPage.goto('/pay-corpus');
    await expect(residentPage).toHaveURL(/\/pay-corpus/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});
