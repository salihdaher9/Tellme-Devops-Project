const { test } = require('node:test');
const assert = require('node:assert');
const { buildMongoUrl } = require('../../../src/utils/db');

const snapshotEnv = () => ({
  MONGO_URL: process.env.MONGO_URL,
  MONGO_DB: process.env.MONGO_DB,
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASSWORD: process.env.MONGO_PASSWORD,
  MONGO_AUTH_SOURCE: process.env.MONGO_AUTH_SOURCE
});

const restoreEnv = (snapshot) => {
  Object.entries(snapshot).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
};

test('buildMongoUrl includes credentials when provided', () => {
  const env = snapshotEnv();
  process.env.MONGO_URL = 'mongodb://localhost:27017';
  process.env.MONGO_DB = 'app';
  process.env.MONGO_USER = 'user';
  process.env.MONGO_PASSWORD = 'pass';
  process.env.MONGO_AUTH_SOURCE = 'admin';
  const url = buildMongoUrl();
  assert.ok(url.includes('mongodb://user:pass@'));
  assert.ok(url.includes('authSource=admin'));
  restoreEnv(env);
});

test('buildMongoUrl falls back to basic url without credentials', () => {
  const env = snapshotEnv();
  process.env.MONGO_URL = 'mongodb://localhost:27017';
  process.env.MONGO_DB = 'app';
  delete process.env.MONGO_PASSWORD;
  delete process.env.MONGO_USER;
  delete process.env.MONGO_AUTH_SOURCE;
  const url = buildMongoUrl();
  const expected = `${process.env.MONGO_URL}/${process.env.MONGO_DB}`;
  assert.strictEqual(url, expected);
  restoreEnv(env);
});
