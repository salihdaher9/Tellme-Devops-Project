const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../../src/app');
const { createServerRunner } = require('../helpers/with-server');
const dbClient = require('../../src/services/dbClient');

require('../../src/models/user');
require('../../src/models/movie');
require('../../src/models/log');
require('../../src/models/friend');

const shouldSkipIntegration = process.env.SKIP_INTEGRATION === 'true' || process.env.IP_INTEGRATION === 'true';
const integration = shouldSkipIntegration ? test.skip : test;

let app;
let withServer;

before(async () => {
  await dbClient.connect();
});

after(async () => {
  if (dbClient.mongoose.connection.readyState === 1) {
    await dbClient.mongoose.disconnect();
  }
});

beforeEach(async () => {
  if (dbClient.mongoose.connection.readyState === 1 && dbClient.mongoose.connection.db) {
    await dbClient.mongoose.connection.db.dropDatabase();
  }
  app = createApp();
  withServer = createServerRunner(app);
});

const registerUser = async (baseUrl, { username, email, password }) => {
  const response = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const body = await response.json();
  assert.strictEqual(response.status, 201);
  return body.data.user;
};

const login = async (baseUrl, { username, password }) => {
  const response = await fetch(`${baseUrl}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const body = await response.json();
  assert.strictEqual(response.status, 201);
  return body.data.token;
};

integration('register -> login -> lookup user uses real DB', async () => {
  await withServer(async (baseUrl) => {
    await registerUser(baseUrl, {
      username: 'demo',
      email: 'demo@example.com',
      password: 'demo123'
    });

    const token = await login(baseUrl, { username: 'demo', password: 'demo123' });
    const response = await fetch(`${baseUrl}/api/users?username=demo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const body = await response.json();
    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.meta.exists, true);
    assert.strictEqual(body.data.user.username, 'demo');
  });
});

integration('logs and recommendations flow across users', async () => {
  await withServer(async (baseUrl) => {
    await registerUser(baseUrl, {
      username: 'alex',
      email: 'alex@example.com',
      password: 'alex123'
    });
    await registerUser(baseUrl, {
      username: 'maya',
      email: 'maya@example.com',
      password: 'maya123'
    });

    const alexToken = await login(baseUrl, { username: 'alex', password: 'alex123' });
    const mayaToken = await login(baseUrl, { username: 'maya', password: 'maya123' });

    const Movie = dbClient.mongoose.model('Movie');
    const movie = await Movie.create({
      title: 'Inception',
      year: 2010,
      genre: 'Sci-Fi',
      posterUrl: ''
    });

    const logResponse = await fetch(`${baseUrl}/api/logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mayaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movieId: movie._id.toString(), rating: 4.5 })
    });
    assert.strictEqual(logResponse.status, 201);

    const recResponse = await fetch(`${baseUrl}/api/recommendations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${alexToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendUsernames: ['maya'] })
    });
    const recBody = await recResponse.json();
    assert.strictEqual(recResponse.status, 200);
    assert.strictEqual(recBody.data.primary.title, 'Inception');
  });
});

integration('logs access is blocked until friendship exists', async () => {
  await withServer(async (baseUrl) => {
    await registerUser(baseUrl, {
      username: 'ravi',
      email: 'ravi@example.com',
      password: 'ravi123'
    });
    await registerUser(baseUrl, {
      username: 'nina',
      email: 'nina@example.com',
      password: 'nina123'
    });

    const raviToken = await login(baseUrl, { username: 'ravi', password: 'ravi123' });
    const ninaToken = await login(baseUrl, { username: 'nina', password: 'nina123' });

    const Movie = dbClient.mongoose.model('Movie');
    const movie = await Movie.create({
      title: 'Arrival',
      year: 2016,
      genre: 'Sci-Fi',
      posterUrl: ''
    });

    const logResponse = await fetch(`${baseUrl}/api/logs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ninaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ movieId: movie._id.toString(), rating: 5 })
    });
    assert.strictEqual(logResponse.status, 201);

    const blocked = await fetch(`${baseUrl}/api/logs?username=nina`, {
      headers: { Authorization: `Bearer ${raviToken}` }
    });
    assert.strictEqual(blocked.status, 403);

    const addFriend = await fetch(`${baseUrl}/api/friends`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${raviToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ friendUsername: 'nina' })
    });
    assert.strictEqual(addFriend.status, 201);

    const allowed = await fetch(`${baseUrl}/api/logs?username=nina`, {
      headers: { Authorization: `Bearer ${raviToken}` }
    });
    assert.strictEqual(allowed.status, 200);
    const allowedBody = await allowed.json();
    assert.strictEqual(allowedBody.data.logs.length, 1);
    assert.strictEqual(allowedBody.data.logs[0].title, 'Arrival');
  });
});
