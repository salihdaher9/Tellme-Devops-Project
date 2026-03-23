const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const usersService = require('../../../src/services/users');
const userModel = require('../../../src/models/user');
const bcrypt = require('bcrypt');
const friendModel = require('../../../src/models/friend');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();

afterEach(() => stubs.restoreAll());

test('registerUser creates normalized user', async () => {
    const payload = { _id: 'u1', username: 'demo', email: 'demo@example.com', avatarUrl: '' };
    stubs.stub(userModel, 'findByUsername', async () => null);
    stubs.stub(userModel, 'findByEmail', async () => null);
    stubs.stub(bcrypt, 'hash', async () => 'hash');
    stubs.stub(userModel, 'createUser', async () => payload);
    const result = await usersService.registerUser({ username: 'demo', email: ' Demo@ExAmplE.Com ', password: '12345' });
    assert.strictEqual(result.email, 'demo@example.com');
    assert.strictEqual(result.username, 'demo');
});

test('registerUser rejects invalid email', async () => {
    await assert.rejects(
      () => usersService.registerUser({ username: 'demo', email: 'invalid', password: '123' }),
      (err) => err.code === 'INVALID_EMAIL'
    );
});

test('lookupUser returns missing flag when not found', async () => {
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => null);
  const result = await usersService.lookupUser('missing');
  assert.strictEqual(result.exists, false);
});

test('getProfileByUsername fails when not friends', async () => {
    const user = { _id: 'u1', username: 'maya' };
    let calls = 0;
    stubs.stub(userModel, 'findByUsernameInsensitive', async () => {
      calls += 1;
      return calls === 1 ? user : { _id: 'viewer' };
    });
    stubs.stub(friendModel, 'findFriend', async () => null);
    await assert.rejects(
      () => usersService.getProfileByUsername({ username: 'maya', viewerUsername: 'demo' }),
      (err) => err.code === 'NOT_FRIENDS'
    );
});
