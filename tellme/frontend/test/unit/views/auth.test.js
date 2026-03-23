import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom, cleanupDom } from '../../helpers/dom.js';
import { renderAuth } from '../../../js/views/auth.js';

const makeFetchMock = (ok = true, payload = {}) => {
  global.fetch = async () => ({ ok, json: async () => payload });
};

beforeEach(() => {
  setupDom();
});

afterEach(() => {
  delete global.fetch;
  cleanupDom();
});

test('renderAuth shows validation error on empty sign-in', async () => {
  const element = renderAuth();
  document.body.appendChild(element);
  const form = element.querySelector('form');
  form.dispatchEvent(new window.Event('submit'));
  const error = element.querySelector('.auth-error');
  assert.strictEqual(error.classList.contains('is-hidden'), false);
  assert.strictEqual(error.textContent, 'Username and password are required.');
});

test('renderAuth shows password mismatch on sign-up', async () => {
  makeFetchMock(true, { data: { user: { username: 'demo' } } });
  const element = renderAuth();
  document.body.appendChild(element);

  const signUpBtn = element.querySelectorAll('.auth-toggle button')[1];
  signUpBtn.click();

  element.querySelector('#signup-username').value = 'demo';
  element.querySelector('#signup-email').value = 'demo@example.com';
  element.querySelector('#signup-password').value = 'pass';
  element.querySelector('#signup-confirm').value = 'different';

  const form = element.querySelector('form');
  form.dispatchEvent(new window.Event('submit'));
  const error = element.querySelector('.auth-error');
  assert.strictEqual(error.textContent, 'Passwords do not match.');
});
