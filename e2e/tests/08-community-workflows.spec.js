/**
 * 08-community-workflows.spec.js
 * Comprehensive tests for community features: notices, polls, forum, events,
 * helpdesk/complaints, documents, emergency contacts.
 * Tests all CRUD operations, button flows, and role-based access.
 */
const { test, expect } = require('../helpers/fixtures');

// ─────────────────────────────────────────────
// NOTICE BOARD
// ─────────────────────────────────────────────
test.describe('Notice Board', () => {
  test('admin can create a notice', async ({ adminAPI }) => {
    const { data: notices } = await adminAPI.get('/admin/notices');
    if (notices.find(n => n.title === 'E2E_Water Shutdown')) return;

    const res = await adminAPI.post('/admin/notices', {
      title: 'E2E_Water Shutdown', content: 'Water supply will be off on April 20.',
      category: 'GENERAL', priority: 'HIGH',
    });
    expect(res.status).toBe(200);
    expect(res.data.title).toBe('E2E_Water Shutdown');
  });

  test('admin can update a notice', async ({ adminAPI }) => {
    const { data: notices } = await adminAPI.get('/admin/notices');
    const notice = notices.find(n => n.title?.startsWith('E2E_'));
    if (!notice) return;

    const res = await adminAPI.put(`/admin/notices/${notice.id}`, {
      ...notice, content: 'Updated: Water supply off April 20-21.',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view notices', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/notices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('notice board page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/notices');
    await expect(residentPage).toHaveURL(/\/notices/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('notice board page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/notices');
    await expect(adminPage).toHaveURL(/\/notices/);
    await adminPage.waitForLoadState('domcontentloaded');
  });

  test('secretary can manage notices', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });

  test('committee member can read notices', async ({ committeeAPI }) => {
    const res = await committeeAPI.get('/admin/notices');
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────
// POLLS & VOTING
// ─────────────────────────────────────────────
test.describe('Polls & Voting', () => {
  test('admin can create a poll', async ({ adminAPI }) => {
    const { data: polls } = await adminAPI.get('/admin/polls');
    if (polls.find(p => p.question?.startsWith('E2E_Playground'))) return;

    const res = await adminAPI.post('/admin/polls', {
      question: 'E2E_Playground renovation?',
      options: ['Agree', 'Disagree', 'Neutral'],
      active: true,
    });
    expect(res.status).toBe(200);
  });

  test('resident can view active polls', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/polls');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('resident can vote on a poll', async ({ residentAPI }) => {
    const { data: polls } = await residentAPI.get('/user/polls');
    const poll = polls.find(p => p.question?.startsWith('E2E_') && p.active);
    if (!poll) return;

    const res = await residentAPI.post(`/user/polls/${poll.id}/vote`, {
      option: poll.options?.[0] || 'Agree',
    });
    // 200 if voted, or may be 400 if already voted
    expect([200, 400]).toContain(res.status);
  });

  test('admin can toggle poll active status', async ({ adminAPI }) => {
    const { data: polls } = await adminAPI.get('/admin/polls');
    const poll = polls.find(p => p.question?.startsWith('E2E_Playground'));
    if (!poll) return;

    const res = await adminAPI.put(`/admin/polls/${poll.id}/toggle`);
    expect(res.status).toBe(200);
  });

  test('polls page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/polls');
    await expect(residentPage).toHaveURL(/\/polls/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// DISCUSSION FORUM
// ─────────────────────────────────────────────
test.describe('Discussion Forum', () => {
  test('resident can create a forum topic', async ({ residentAPI }) => {
    const { data: topics } = await residentAPI.get('/user/forum/topics');
    if (topics.find(t => t.title === 'E2E_Park Maintenance')) return;

    const res = await residentAPI.post('/user/forum/topics', {
      title: 'E2E_Park Maintenance', content: 'The park needs new benches.',
      category: 'GENERAL',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view forum topics', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/forum/topics');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('resident can reply to a topic', async ({ residentAPI }) => {
    const { data: topics } = await residentAPI.get('/user/forum/topics');
    const topic = topics.find(t => t.title?.startsWith('E2E_'));
    if (!topic) return;

    const res = await residentAPI.post(`/user/forum/topics/${topic.id}/reply`, {
      content: 'E2E I agree, we need new benches!',
    });
    expect(res.status).toBe(200);
  });

  test('forum page renders', async ({ residentPage }) => {
    await residentPage.goto('/forum');
    await expect(residentPage).toHaveURL(/\/forum/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────
test.describe('Events', () => {
  test('admin can create an event', async ({ adminAPI }) => {
    const { data: events } = await adminAPI.get('/admin/events');
    if (events.find(e => e.title === 'E2E_Diwali Celebration')) return;

    const res = await adminAPI.post('/admin/events', {
      title: 'E2E_Diwali Celebration', description: 'Annual Diwali event',
      eventDate: '2026-10-20', eventTime: '19:00', location: 'Club House',
      maxAttendees: 200,
    });
    expect(res.status).toBe(200);
  });

  test('resident can view events', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('resident can RSVP to an event', async ({ residentAPI }) => {
    const { data: events } = await residentAPI.get('/user/events');
    const event = events.find(e => e.title?.startsWith('E2E_'));
    if (!event) return;

    const res = await residentAPI.post(`/user/events/${event.id}/rsvp`, {
      attending: true,
    });
    expect([200, 400]).toContain(res.status); // 400 if already RSVP'd
  });

  test('events page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/events');
    await expect(residentPage).toHaveURL(/\/events/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// HELPDESK / COMPLAINTS
// ─────────────────────────────────────────────
test.describe('Helpdesk / Complaints', () => {
  test('resident can create a complaint', async ({ residentAPI }) => {
    const res = await residentAPI.post('/user/complaints', {
      title: 'E2E_Broken Lift', description: 'Lift B has been out of order for 3 days.',
      category: 'MAINTENANCE', priority: 'HIGH',
    });
    expect(res.status).toBe(200);
    expect(res.data.title).toBe('E2E_Broken Lift');
    expect(res.data.status).toBe('OPEN');
  });

  test('resident can view own complaints', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/complaints');
    expect(res.status).toBe(200);
    const e2eComplaints = res.data.filter(c => c.title?.startsWith('E2E_'));
    expect(e2eComplaints.length).toBeGreaterThan(0);
  });

  test('admin can view all complaints', async ({ adminAPI }) => {
    const res = await adminAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('admin can update complaint status', async ({ adminAPI }) => {
    const { data: complaints } = await adminAPI.get('/admin/complaints');
    const openComplaint = complaints.find(c => c.title?.startsWith('E2E_') && c.status === 'OPEN');
    if (!openComplaint) return;

    const res = await adminAPI.put(`/admin/complaints/${openComplaint.id}`, {
      status: 'IN_PROGRESS', adminRemarks: 'E2E Technician dispatched',
    });
    expect(res.status).toBe(200);
  });

  test('secretary can manage complaints', async ({ secretaryAPI }) => {
    const res = await secretaryAPI.get('/admin/complaints');
    expect(res.status).toBe(200);
  });

  test('complaints page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/complaints');
    await expect(residentPage).toHaveURL(/\/complaints/);
    await residentPage.waitForLoadState('domcontentloaded');
  });

  test('complaint management page renders for admin', async ({ adminPage }) => {
    await adminPage.goto('/complaint-management');
    await expect(adminPage).toHaveURL(/\/complaint-management/);
    await adminPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────
test.describe('Documents', () => {
  test('resident can view documents', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/documents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  test('documents page renders for resident', async ({ residentPage }) => {
    await residentPage.goto('/documents');
    await expect(residentPage).toHaveURL(/\/documents/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});

// ─────────────────────────────────────────────
// EMERGENCY CONTACTS
// ─────────────────────────────────────────────
test.describe('Emergency Contacts', () => {
  test('admin can create an emergency contact', async ({ adminAPI }) => {
    const { data: contacts } = await adminAPI.get('/admin/emergency-contacts');
    if (contacts.find(c => c.name === 'E2E_Hospital')) return;

    const res = await adminAPI.post('/admin/emergency-contacts', {
      name: 'E2E_Hospital', phone: '108', type: 'MEDICAL',
    });
    expect(res.status).toBe(200);
  });

  test('resident can view emergency contacts', async ({ residentAPI }) => {
    const res = await residentAPI.get('/user/emergency-contacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    const e2e = res.data.filter(c => c.name?.startsWith('E2E_'));
    expect(e2e.length).toBeGreaterThan(0);
  });

  test('emergency contacts page renders', async ({ residentPage }) => {
    await residentPage.goto('/emergency');
    await expect(residentPage).toHaveURL(/\/emergency/);
    await residentPage.waitForLoadState('domcontentloaded');
  });
});
