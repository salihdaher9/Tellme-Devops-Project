const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const friendsController = require('../../../src/controllers/friends');
const friendsService = require('../../../src/services/friends');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();

const makeRes = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

afterEach(() => stubs.restoreAll());

test('listFriends returns friends and count', async () => {
  const friends = [{ id: 'f1', username: 'maya' }];
  stubs.stub(friendsService, 'listFriends', async () => ({ friends, count: 1 }));
  const req = { user: { username: 'demo' } };
  const res = makeRes();
  let nextCalled = false;
  await friendsController.listFriends(req, res, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.friends, friends);
  assert.strictEqual(res.body.meta.count, 1);
});

test('createFriend handles service error via next', async () => {
  const err = new Error('bad');
  stubs.stub(friendsService, 'addFriend', async () => { throw err; });
  const req = { user: { username: 'demo' }, body: { friendUsername: 'maya' } };
  const res = makeRes();
  let received;
  await friendsController.createFriend(req, res, (error) => { received = error; });
  assert.strictEqual(received, err);
});
