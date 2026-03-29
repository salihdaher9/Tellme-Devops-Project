const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const friendsService = require('../../src/services/friends');
const userModel = require('../../src/models/user');
const friendModel = require('../../src/models/friend');
const { createStubManager } = require('../helpers/stub-manager');

const stubs = createStubManager();

afterEach(() => {
  stubs.restoreAll();
});

test('addFriend returns friend record when successful', async () => {
  const user = { _id: 'u1', username: 'demo' };
  const friend = { _id: 'm1', username: 'maya', avatarUrl: 'pic' };
  stubs.stub(userModel, 'findByUsernameInsensitive', async (value) => {
    if (value === 'demo') return user;
    if (value === 'maya') return friend;
    return null;
  });
  stubs.stub(friendModel, 'findFriend', async () => null);
  stubs.stub(friendModel, 'createFriend', async () => ({ id: 'rec' }));

  const result = await friendsService.addFriend({ username: 'demo', friendUsername: 'maya' });
  assert.strictEqual(result.friend.username, 'maya');
  assert.strictEqual(result.friend._id, friend._id);
});

test('addFriend rejects when trying to add self', async () => {
  await assert.rejects(
    () => friendsService.addFriend({ username: 'demo', friendUsername: 'demo' }),
    (err) => err.code === 'CANNOT_ADD_SELF'
  );
});

test('listFriends maps friend records to user data', async () => {
  const user = { _id: 'u1', username: 'demo' };
  const record = { _id: 'r1', friendId: 'f1' };
  const friendUser = { _id: 'f1', username: 'maya', avatarUrl: 'pic' };
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => user);
  stubs.stub(friendModel, 'listFriends', async () => [record]);
  stubs.stub(userModel, 'findByIds', async () => [friendUser]);

  const result = await friendsService.listFriends({ username: 'demo' });
  assert.strictEqual(result.count, 1);
  assert.strictEqual(result.friends[0].username, 'maya');
});
