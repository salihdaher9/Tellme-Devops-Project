const { test } = require('node:test');
const assert = require('node:assert');
const errorHandler = require('../../../src/middleware/error');

test('error handler formats response', () => {
  const err = new Error('boom');
  err.code = 'BOOM';
  err.status = 418;
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  errorHandler(err, { method: 'GET', originalUrl: '/test' }, res, () => {});
  assert.strictEqual(res.statusCode, 418);
  assert.strictEqual(res.body.error.code, 'BOOM');
});
