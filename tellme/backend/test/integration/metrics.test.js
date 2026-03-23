const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createServerRunner } = require('../helpers/with-server');
const { createStubManager } = require('../helpers/stub-manager');
const metricsService = require('../../src/services/metricsService');

const stubs = createStubManager();
const shouldSkipIntegration = process.env.SKIP_INTEGRATION === 'true' || process.env.IP_INTEGRATION === 'true';
const integration = shouldSkipIntegration ? test.skip : test;

test.afterEach(() => stubs.restoreAll());

integration('GET /metrics returns Prometheus text format', async () => {
  stubs.stub(metricsService, 'updateDbMetrics', async () => {});
  stubs.stub(metricsService, 'recordError', () => {});

  const app = createApp();
  const withServer = createServerRunner(app);
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/metrics`);
    assert.strictEqual(response.status, 200);
    const contentType = response.headers.get('content-type') || '';
    assert.ok(contentType.includes('text/plain'));
    const body = await response.text();
    assert.ok(body.includes('app_requests_total'));
  });
});

integration('GET /metrics surfaces telemetry failure as 503', async () => {
  const error = new Error('db down');
  error.code = 'DB_UNAVAILABLE';
  error.status = 503;
  const recordErrorStub = stubs.stub(metricsService, 'recordError', () => {});
  stubs.stub(metricsService, 'updateDbMetrics', async () => {
    throw error;
  });

  const app = createApp();
  const withServer = createServerRunner(app);
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/metrics`);
    assert.strictEqual(response.status, 503);
    const body = await response.text();
    assert.strictEqual(body, '');
    assert.strictEqual(recordErrorStub.calls.length, 1);
  });
});
