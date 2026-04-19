/**
 * Lightweight HTTP client for direct API calls (bypasses browser).
 * Used for test data seeding and API-level permission checks.
 */
const API_BASE = process.env.API_URL || 'http://localhost:8080/api';

async function request(method, path, { body, token, expectStatus } = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (expectStatus && res.status !== expectStatus) {
    throw new Error(`${method} ${path} → ${res.status} (expected ${expectStatus})\n${typeof data === 'string' ? data : JSON.stringify(data, null, 2)}`);
  }

  return { status: res.status, data, ok: res.ok };
}

function client(token) {
  return {
    get:    (path, opts)       => request('GET', path, { ...opts, token }),
    post:   (path, body, opts) => request('POST', path, { ...opts, body, token }),
    put:    (path, body, opts) => request('PUT', path, { ...opts, body, token }),
    delete: (path, opts)       => request('DELETE', path, { ...opts, token }),
  };
}

async function login(username, password = 'welcome') {
  const { data } = await request('POST', '/auth/login', {
    body: { username, password },
    expectStatus: 200,
  });
  return { token: data.token, user: data };
}

module.exports = { client, login, request, API_BASE };
