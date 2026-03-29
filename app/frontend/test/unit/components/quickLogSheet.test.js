import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../../helpers/dom.js';
import { quickLogSheet } from '../../../js/components/quickLogSheet.js';

const makeFetchMock = (ok = true, payload = {}) => {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return { ok, json: async () => payload };
  };
  return calls;
};

beforeEach(() => {
  setupDom();
});

afterEach(() => {
  delete global.fetch;
  cleanupDom();
});

test('quickLogSheet opens and submits log', async () => {
  const calls = makeFetchMock(true, { data: { log: {} } });
  const sheet = quickLogSheet();
  document.body.appendChild(sheet.element);
  sheet.open('movie-1');
  assert.ok(!sheet.element.classList.contains('is-hidden'));

  const confirm = sheet.element.querySelector('.quick-log-confirm');
  confirm.click();

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(calls.length, 1);
  assert.ok(calls[0].url.includes('/api/logs'));
});
