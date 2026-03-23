const { test } = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../../src/app');
const moviesService = require('../../src/services/movies');
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

integration('GET /health responds with ok payload', async () => {
  try {
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(body.data.status, 'ok');
    });
  } catch (err) {
    console.error('Health root test failed', err);
    throw err;
  }
});

integration('GET /health/seed reports seeded=true when movies exist', async () => {
  try {
    stubs.stub(moviesService, 'countMovies', async () => 12);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health/seed`);
      const body = await response.json();
      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(body.data, { seeded: true });
      assert.strictEqual(body.meta.count, 12);
    });
  } catch (err) {
    console.error('Health seed success test failed', err);
    throw err;
  }
});

integration('GET /health/seed returns error when no movies available', async () => {
  try {
    stubs.stub(moviesService, 'countMovies', async () => 0);
    await withServer(async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health/seed`);
      const body = await response.json();
      assert.strictEqual(response.status, 500);
      assert.strictEqual(body.error.code, 'SEED_MISSING');
    });
  } catch (err) {
    console.error('Health seed error test failed', err);
    throw err;
  }
});
