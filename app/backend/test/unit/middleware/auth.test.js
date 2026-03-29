const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const auth = require('../../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();
afterEach(() => stubs.restoreAll());

test('auth attaches payload and calls next', async () => {
  const req = { headers: { authorization: 'Bearer token' } };
  let nextCalled = false;
  stubs.stub(jwt, 'verify', () => ({ sub: 'u1', username: 'demo' }));
  auth(req, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  assert.strictEqual(req.user.username, 'demo');
});

test('auth rejects missing token', () => {
  const req = { headers: {} };
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  let nextCalled = false;
  auth(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 401);
});
