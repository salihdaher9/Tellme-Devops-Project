const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const recommendationsService = require('../../../src/services/recommendations');
const userModel = require('../../../src/models/user');
const logModel = require('../../../src/models/log');
const movieModel = require('../../../src/models/movie');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();
afterEach(() => stubs.restoreAll());

test('recommend returns ranked movies', async () => {
  const movie = { _id: 'm1', title: 'Inception', year: 2010, posterUrl: 'p', genre: 'sci-fi' };
  let calls = 0;
  stubs.stub(userModel, 'findByUsernameInsensitive', async () => {
    calls += 1;
    return calls === 1
      ? { _id: 'f1' }
      : { _id: 'viewer', username: 'demo' };
  });
  stubs.stub(logModel, 'listLogsByUsers', async () => [{ movieId: { toString: () => 'm1' }, rating: 5 }]);
  stubs.stub(logModel, 'listLogs', async () => []);
  stubs.stub(movieModel, 'findByIds', async () => [movie]);

  const result = await recommendationsService.recommend({
    username: 'demo',
    friendUsernames: ['f1'],
    genre: 'sci-fi'
  });
  assert.strictEqual(result.primary.title, 'Inception');
});

test('recommend errors when friends missing', async () => {
  await assert.rejects(
    () => recommendationsService.recommend({ username: 'demo', friendUsernames: [], genre: 'sci-fi' }),
    (err) => err.code === 'FRIENDS_REQUIRED'
  );
});
