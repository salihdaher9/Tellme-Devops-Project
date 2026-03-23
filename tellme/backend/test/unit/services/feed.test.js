const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const feedService = require('../../../src/services/feed');
const userModel = require('../../../src/models/user');
const friendModel = require('../../../src/models/friend');
const logModel = require('../../../src/models/log');
const movieModel = require('../../../src/models/movie');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();

afterEach(() => stubs.restoreAll());

test('listFeed constructs entries when friends exist', async () => {
  const user = { _id: 'u1' };
  const friend = { _id: 'f1', friendId: 'f2' };
  const friendUser = { _id: 'f2', username: 'maya', avatarUrl: 'a', email: 'm@example.com' };
  const log = { movieId: { toString: () => 'm1' }, userId: { toString: () => 'f2' }, rating: 5, createdAt: 1, review: 'great' };
  const movie = { _id: 'm1', title: 'Inception', posterUrl: 'p' };
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => user);
  stubs.stub(friendModel, 'listFriends', async () => [friend]);
  stubs.stub(userModel, 'findByIds', async () => [friendUser]);
  stubs.stub(logModel, 'listLogsByUsers', async () => [log]);
  stubs.stub(movieModel, 'findByIds', async () => [movie]);

  const result = await feedService.listFeed({ username: 'demo', limit: 1 });
  assert.strictEqual(result[0].username, 'maya');
  assert.strictEqual(result[0].title, 'Inception');
});

test('listFeed error when username missing', async () => {
  await assert.rejects(
    () => feedService.listFeed({}),
    (err) => err.code === 'USERNAME_REQUIRED'
  );
});
