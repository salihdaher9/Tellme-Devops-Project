const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const moviesService = require('../../../src/services/movies');
const movieModel = require('../../../src/models/movie');
const logModel = require('../../../src/models/log');
const userModel = require('../../../src/models/user');
const friendModel = require('../../../src/models/friend');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();
afterEach(() => stubs.restoreAll());

test('getMovieById returns stats and reviews', async () => {
  const movie = { _id: 'm1', title: 'Inception', year: 2010, genre: 'sci-fi' };
  const log = { _id: 'l1', movieId: 'm1', userId: { toString: () => 'u1' }, rating: 4, review: 'Great', createdAt: new Date() };
  stubs.stub(movieModel, 'findMovieById', async () => movie);
  stubs.stub(logModel, 'listLogsByMovie', async () => [log]);
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => ({ _id: 'viewer', username: 'demo' }));
  stubs.stub(logModel, 'listLogs', async () => []);
  stubs.stub(userModel, 'findByIds', async () => [{ _id: 'u1', username: 'maya', avatarUrl: 'a' }]);
  stubs.stub(friendModel, 'listFriends', async () => [{ friendId: 'u1' }]);

  const result = await moviesService.getMovieById('m1', 'demo');
  assert.strictEqual(result.stats.overallAverage, 4);
  assert.strictEqual(result.reviews[0].username, 'maya');
});

test('getMovieById rejects when id missing', async () => {
  await assert.rejects(
    () => moviesService.getMovieById(),
    (err) => err.code === 'MOVIE_ID_REQUIRED'
  );
});
