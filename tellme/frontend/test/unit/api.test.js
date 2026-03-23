import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../helpers/dom.js';
import { state } from '../../js/state.js';

const makeFetchMock = (payload = { data: {} }, ok = true) => {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok,
      json: async () => payload
    };
  };
  return calls;
};

beforeEach(() => {
  setupDom();
  state.token = 'token-123';
});

afterEach(() => {
  delete global.fetch;
  cleanupDom();
});

test('api.getFeed sends auth header', async () => {
  const calls = makeFetchMock({ data: { feed: [] } });
  const { api } = await import('../../js/api.js');
  await api.getFeed();
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].url, 'http://api.test/api/feed');
  assert.strictEqual(calls[0].options.headers.Authorization, 'Bearer token-123');
});

test('api.addFriend posts JSON payload', async () => {
  const calls = makeFetchMock({ data: { friend: {} } });
  const { api } = await import('../../js/api.js');
  await api.addFriend({ friendUsername: 'maya' });
  const { url, options } = calls[0];
  assert.strictEqual(url, 'http://api.test/api/friends');
  assert.strictEqual(options.method, 'POST');
  assert.strictEqual(options.headers['Content-Type'], 'application/json');
  assert.strictEqual(options.body, JSON.stringify({ friendUsername: 'maya' }));
});

test('api.getMovie uses encoded id', async () => {
  const calls = makeFetchMock({ data: { movie: {} } });
  const { api } = await import('../../js/api.js');
  await api.getMovie('id with space');
  assert.strictEqual(calls[0].url, 'http://api.test/api/movies/id%20with%20space');
});
