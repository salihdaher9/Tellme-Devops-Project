const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../src/app');
const usersService = require('../../src/services/users');
const friendsService = require('../../src/services/friends');
const logsService = require('../../src/services/logs');
const feedService = require('../../src/services/feed');
const moviesService = require('../../src/services/movies');
const recommendationsService = require('../../src/services/recommendations');
const { createServerRunner } = require('../helpers/with-server');
const { createStubManager } = require('../helpers/stub-manager');

const stubs = createStubManager();
let app;
let withServer;
const jwtSecret = process.env.JWT_SECRET || 'dev-secret';
const authToken = jwt.sign({ username: 'demo', email: 'demo@example.com' }, jwtSecret);

test.beforeEach(() => {
  app = createApp();
  withServer = createServerRunner(app);
});

test.afterEach(() => {
  stubs.restoreAll();
});

test('GET /api/users returns lookup payload when authenticated', async () => {
  const result = { user: { username: 'demo', email: 'demo@example.com' }, exists: true };
  stubs.stub(usersService, 'lookupUser', async () => result);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users?username=demo`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.deepStrictEqual(body.data.user, result.user);
    assert.strictEqual(body.meta.exists, true);
  });
});

test('POST /api/users registers a user', async () => {
  const created = { username: 'newbie', email: 'newbie@example.com' };
  stubs.stub(usersService, 'registerUser', async () => created);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newbie', email: 'newbie@example.com', password: 'pass' })
    });
    assert.strictEqual(response.status, 201);
    const body = await response.json();
    assert.deepStrictEqual(body.data.user, created);
  });
});

test('POST /api/friends returns new friend when authenticated', async () => {
  const friendPayload = { friend: { username: 'maya', _id: 'f1' } };
  stubs.stub(friendsService, 'addFriend', async () => friendPayload);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/friends`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendUsername: 'maya' })
    });
    assert.strictEqual(response.status, 201);
    const body = await response.json();
    assert.deepStrictEqual(body.data.friend, friendPayload.friend);
  });
});

test('DELETE /api/friends/:id removes friend when authenticated', async () => {
  stubs.stub(friendsService, 'removeFriend', async () => ({ removed: true }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/friends/f1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.data.removed, true);
  });
});

test('GET /api/logs returns viewer logs when authenticated', async () => {
  const logs = [{ id: 'l1', title: 'Inception' }];
  stubs.stub(logsService, 'listLogs', async () => logs);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/logs?username=demo`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.meta.count, logs.length);
    assert.deepStrictEqual(body.data.logs, logs);
  });
});

test('POST /api/logs creates a log entry when authenticated', async () => {
  const created = { id: 'l2', movieId: 'm1', rating: 4 };
  stubs.stub(logsService, 'createLog', async () => created);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movieId: 'm1', rating: 4 })
    });
    assert.strictEqual(response.status, 201);
    const body = await response.json();
    assert.deepStrictEqual(body.data.log, created);
  });
});

test('GET /api/feed returns feed entries', async () => {
  const feed = [{ username: 'maya', title: 'Inception' }];
  stubs.stub(feedService, 'listFeed', async () => feed);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/feed`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.meta.count, feed.length);
    assert.deepStrictEqual(body.data.feed, feed);
  });
});

test('GET /api/followers returns follower list', async () => {
  const payload = { followers: [{ username: 'maya' }], count: 1 };
  stubs.stub(friendsService, 'listFollowers', async () => payload);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/followers`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.meta.count, payload.count);
    assert.deepStrictEqual(body.data.followers, payload.followers);
  });
});

test('GET /api/movies lists movies and /api/movies/:id returns movie detail', async () => {
  const movie = { title: 'Inception', year: 2010 };
  stubs.stub(moviesService, 'listMovies', async () => [movie]);
  stubs.stub(moviesService, 'getMovieById', async () => movie);

  await withServer(async (baseUrl) => {
    const listResponse = await fetch(`${baseUrl}/api/movies`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.deepStrictEqual(listBody.data.movies, [movie]);

    const detailResponse = await fetch(`${baseUrl}/api/movies/123`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(detailResponse.status, 200);
    const detailBody = await detailResponse.json();
    assert.deepStrictEqual(detailBody.data.movie, movie);
  });
});

test('POST /api/recommendations returns ranked movies', async () => {
  const payload = { primary: { title: 'Inception' }, secondary: [] };
  stubs.stub(recommendationsService, 'recommend', async () => payload);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/recommendations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendUsernames: ['maya'] })
    });
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.deepStrictEqual(body.data.primary, payload.primary);
    assert.deepStrictEqual(body.data.secondary, payload.secondary);
  });
});
