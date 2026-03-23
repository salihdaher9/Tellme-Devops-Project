const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const sessionsService = require('../../src/services/sessions');
const userModel = require('../../src/models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createStubManager } = require('../helpers/stub-manager');

const stubs = createStubManager();

afterEach(() => {
  stubs.restoreAll();
});

test('createSession requires username and password', async () => {
  await assert.rejects(
    () => sessionsService.createSession({}),
    (err) => err.code === 'VALIDATION_ERROR'
  );
});

test('createSession rejects when user not found', async () => {
  stubs.stub(userModel, 'findByUsername', async () => null);
  await assert.rejects(
    () => sessionsService.createSession({ username: 'missing', password: 'pass' }),
    (err) => err.code === 'INVALID_CREDENTIALS' && err.status === 401
  );
});

test('createSession rejects when password mismatch', async () => {
  const user = { _id: 'u1', username: 'demo', email: 'demo@example.com', passwordHash: 'hash' };
  stubs.stub(userModel, 'findByUsername', async () => user);
  stubs.stub(bcrypt, 'compare', async () => false);
  await assert.rejects(
    () => sessionsService.createSession({ username: 'demo', password: 'bad' }),
    (err) => err.code === 'INVALID_CREDENTIALS'
  );
});

test('createSession returns token and user on success', async () => {
  const user = { _id: 'uid', username: 'demo', email: 'demo@example.com', passwordHash: 'hash' };
  stubs.stub(userModel, 'findByUsername', async () => user);
  stubs.stub(bcrypt, 'compare', async () => true);
  let captured = null;
  const jwtSign = stubs.stub(jwt, 'sign', (payload) => {
    captured = payload;
    return 'signed-token';
  });
  const result = await sessionsService.createSession({ username: 'demo', password: 'demo123' });
  assert.strictEqual(result.token, 'signed-token');
  assert.deepStrictEqual(result.user, { username: 'demo', email: 'demo@example.com' });
  assert.strictEqual(jwtSign.calls.length, 1);
  assert.deepStrictEqual(captured, {
    sub: 'uid',
    username: 'demo',
    email: 'demo@example.com'
  });
});
