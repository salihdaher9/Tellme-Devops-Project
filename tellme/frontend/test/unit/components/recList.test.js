import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../../helpers/dom.js';
import { recList } from '../../../js/components/recList.js';

beforeEach(() => {
  setupDom();
});

afterEach(() => {
  cleanupDom();
});

test('recList renders empty state when no primary', () => {
  const element = recList({ primary: null, secondary: [] });
  assert.strictEqual(element.textContent, 'No recommendations yet.');
});

test('recList renders primary card and log button', () => {
  let clickedId = null;
  const element = recList(
    { primary: { id: 'm1', title: 'Inception', year: 2010 }, secondary: [] },
    { onLogPick: (id) => { clickedId = id; } }
  );
  const button = element.querySelector('button.rec-log');
  assert.ok(button);
  button.click();
  assert.strictEqual(clickedId, 'm1');
});
