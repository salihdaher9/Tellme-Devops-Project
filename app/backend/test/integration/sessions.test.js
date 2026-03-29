const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../../src/app');
const sessionsService = require('../../src/services/sessions');
const { createStubManager } = require('../helpers/stub-manager');
const { createServerRunner } = require('../helpers/with-server');

const stubs = createStubManager();
let app;
let withServer;
const shouldSkipIntegration = process.env.SKIP_INTEGRATION === 'true' || process.env.IP_INTEGRATION === 'true';
const integration = shouldSkipIntegration ? test.skip : test;

test.beforeEach(() => {
  app = createApp();
  withServer = createServerRunner(app);
});

test.afterEach(() => {
  stubs.restoreAll();
});

integration('POST /api/sessions responds with token payload', async () => {
  try {
    const payload = {
      user: { username: 'demo', email: 'demo@example.com' },
      token: 'jwt-token'
    };
    stubs.stub(sessionsService, 'createSession', async () => payload);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'demo123' })
      });
      const body = await response.json();
      assert.strictEqual(response.status, 201);
      assert.deepStrictEqual(body.data, payload);
    });
  } catch (err) {
    console.error('Sessions success test failed', err);
    throw err;
  }
});

integration('POST /api/sessions surfaces service errors', async () => {
  try {
    const error = new Error('Invalid credentials');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    stubs.stub(sessionsService, 'createSession', async () => {
      throw error;
    });
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'demo', password: 'wrong' })
      });
      const body = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(body.error.code, 'INVALID_CREDENTIALS');
      assert.strictEqual(body.error.message, 'Invalid credentials');
    });
  } catch (err) {
    console.error('Sessions error test failed', err);
    throw err;
  }
});
