const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const logsService = require('../../../src/services/logs');
const userModel = require('../../../src/models/user');
const movieModel = require('../../../src/models/movie');
const logModel = require('../../../src/models/log');
const friendModel = require('../../../src/models/friend');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();
afterEach(() => stubs.restoreAll());

test('createLog rejects when required fields missing', async () => {
  await assert.rejects(
    () => logsService.createLog({ username: '', movieId: '', rating: null }),
    (err) => err.code === 'VALIDATION_ERROR'
  );
});

test('createLog rejects invalid rating', async () => {
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => ({ _id: 'u1', username: 'demo' }));
  stubs.stub(movieModel, 'findMovieById', async () => ({ _id: 'm1', title: 'Inception' }));
  await assert.rejects(
    () => logsService.createLog({ username: 'demo', movieId: 'm1', rating: 8 }),
    (err) => err.code === 'INVALID_RATING'
  );
});

test('listLogs rejects when viewer is not a friend', async () => {
  stubs.stub(userModel, 'findByUsernameInsensitive', async (username) => {
    if (username === 'owner') return { _id: 'u1', username: 'owner' };
    return { _id: 'u2', username: 'viewer' };
  });
  stubs.stub(friendModel, 'findFriend', async () => null);
  await assert.rejects(
    () => logsService.listLogs({ username: 'owner', viewerUsername: 'viewer' }),
    (err) => err.code === 'NOT_FRIENDS'
  );
});

test('listLogs returns mapped entries with movie details', async () => {
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => ({ _id: 'u1', username: 'demo' }));
  stubs.stub(logModel, 'listLogs', async () => ([
    { _id: 'l1', movieId: { toString: () => 'm1' }, rating: 4, review: 'Nice', createdAt: 'today' }
  ]));
  stubs.stub(movieModel, 'findByIds', async () => ([
    { _id: 'm1', title: 'Inception', posterUrl: 'p' }
  ]));

  const logs = await logsService.listLogs({ username: 'demo' });
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].title, 'Inception');
  assert.strictEqual(logs[0].rating, 4);
});
