import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../helpers/dom.js';
import { state, loadAuthFromStorage, clearAuthStorage, setActiveView } from '../../js/state.js';

let storage;

beforeEach(() => {
  setupDom();
  storage = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: (key) => { delete storage[key]; }
    },
    configurable: true
  });
  state.activeView = 'feed';
  state.isAuthenticated = false;
  state.auth = null;
  state.token = null;
});

afterEach(() => {
  cleanupDom();
});

test('loadAuthFromStorage populates auth when token exists', () => {
  window.localStorage.setItem('auth', JSON.stringify({ token: 'jt', user: { username: 'demo' } }));
  loadAuthFromStorage();
  assert.strictEqual(state.isAuthenticated, true);
  assert.strictEqual(state.token, 'jt');
  assert.strictEqual(state.auth.username, 'demo');
});

test('loadAuthFromStorage ignores invalid JSON', () => {
  window.localStorage.setItem('auth', '{bad');
  loadAuthFromStorage();
  assert.strictEqual(state.isAuthenticated, false);
});

test('clearAuthStorage removes storage key', () => {
  window.localStorage.setItem('auth', 'value');
  clearAuthStorage();
  assert.strictEqual(window.localStorage.getItem('auth'), null);
});

test('setActiveView updates state', () => {
  setActiveView('logs');
  assert.strictEqual(state.activeView, 'logs');
});
