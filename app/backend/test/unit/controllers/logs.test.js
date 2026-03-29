const { beforeEach, afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const logsController = require('../../../src/controllers/logs');
const logsService = require('../../../src/services/logs');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();

const createRes = () => {
  let statusValue;
  let payload;
  return {
    status(code) {
      statusValue = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
    get statusCode() {
      return statusValue;
    },
    get body() {
      return payload;
    }
  };
};

beforeEach(() => {
  stubs.restoreAll();
});

afterEach(() => {
  stubs.restoreAll();
});

test('createLog returns created log', async () => {
  const created = { id: 'log1', rating: 4 };
  stubs.stub(logsService, 'createLog', async () => created);
  const req = { user: { username: 'demo' }, body: { movieId: 'm1', rating: 4 } };
  const res = createRes();
  await logsController.createLog(req, res);
  assert.strictEqual(res.statusCode, 201);
  assert.deepStrictEqual(res.body.data.log, created);
});

test('listLogs returns logs for viewer', async () => {
  const logs = [{ id: 'l1' }];
  stubs.stub(logsService, 'listLogs', async () => logs);
  const req = { user: { username: 'demo' }, query: { username: 'demo' } };
  const res = createRes();
  await logsController.listLogs(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.logs, logs);
  assert.strictEqual(res.body.meta.count, logs.length);
});
