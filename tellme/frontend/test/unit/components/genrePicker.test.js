import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../../helpers/dom.js';
import { state } from '../../../js/state.js';
import { genrePicker } from '../../../js/components/genrePicker.js';

beforeEach(() => {
  setupDom();
  state.pickForMeSelections.genre = '';
});

afterEach(() => {
  cleanupDom();
});

test('genrePicker renders options and updates state on change', () => {
  const picker = genrePicker();
  document.body.appendChild(picker);
  const select = picker.querySelector('select');
  assert.ok(select);
  assert.ok(select.options.length >= 6);
  select.value = 'Drama';
  select.dispatchEvent(new window.Event('change'));
  assert.strictEqual(state.pickForMeSelections.genre, 'Drama');
});
