import { BASE_URL } from '../config.js';

export const renderAuth = ({ onAuthSuccess, requireAuthMessage } = {}) => {
  const container = document.createElement('section');
  container.className = 'auth';

  const panel = document.createElement('div');
  panel.className = 'auth-panel';

  const heading = document.createElement('h2');
  heading.textContent = 'Welcome';

  const toggle = document.createElement('div');
  toggle.className = 'auth-toggle';

  const signInBtn = document.createElement('button');
  signInBtn.type = 'button';
  signInBtn.textContent = 'Sign In';
  signInBtn.className = 'is-active';

  const signUpBtn = document.createElement('button');
  signUpBtn.type = 'button';
  signUpBtn.textContent = 'Sign Up';

  toggle.appendChild(signInBtn);
  toggle.appendChild(signUpBtn);

  const form = document.createElement('form');
  form.className = 'auth-form';

  const notice = document.createElement('div');
  notice.className = requireAuthMessage ? 'auth-notice' : 'auth-notice is-hidden';
  notice.textContent = 'Sign in required to access the app.';

  const signInFields = document.createElement('div');
  signInFields.className = 'auth-fields';
  signInFields.dataset.mode = 'signin';

  const signUpFields = document.createElement('div');
  signUpFields.className = 'auth-fields is-hidden';
  signUpFields.dataset.mode = 'signup';

  const makeField = (id, labelText, type = 'text') => {
    const field = document.createElement('div');
    field.className = 'form-field';

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;

    const input = document.createElement('input');
    input.id = id;
    input.name = id;
    input.type = type;

    field.appendChild(label);
    field.appendChild(input);
    return field;
  };

  signInFields.appendChild(makeField('signin-username', 'Username'));
  signInFields.appendChild(makeField('signin-password', 'Password', 'password'));

  signUpFields.appendChild(makeField('signup-username', 'Username'));
  signUpFields.appendChild(makeField('signup-email', 'Email', 'email'));
  signUpFields.appendChild(makeField('signup-password', 'Password', 'password'));
  signUpFields.appendChild(makeField('signup-confirm', 'Confirm Password', 'password'));

  const message = document.createElement('div');
  message.className = 'auth-message';

  const error = document.createElement('div');
  error.className = 'auth-error is-hidden';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'auth-submit';
  submit.textContent = 'Create account';

  form.appendChild(signInFields);
  form.appendChild(signUpFields);
  form.appendChild(notice);
  form.appendChild(error);
  form.appendChild(message);
  form.appendChild(submit);

  let mode = 'signin';

  const setMode = (nextMode) => {
    mode = nextMode;
    const isSignIn = mode === 'signin';
    signInFields.classList.toggle('is-hidden', !isSignIn);
    signUpFields.classList.toggle('is-hidden', isSignIn);
    signInBtn.classList.toggle('is-active', isSignIn);
    signUpBtn.classList.toggle('is-active', !isSignIn);
    message.textContent = '';
    error.textContent = '';
    error.classList.add('is-hidden');
    notice.classList.add('is-hidden');
    submit.textContent = isSignIn ? 'Sign in' : 'Create account';
  };

  signInBtn.addEventListener('click', () => setMode('signin'));
  signUpBtn.addEventListener('click', () => setMode('signup'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = '';
    error.textContent = '';
    error.classList.add('is-hidden');
    try {
      if (mode === 'signin') {
        const username = form.querySelector('#signin-username').value.trim();
        const password = form.querySelector('#signin-password').value;

        if (!username || !password) {
          error.textContent = 'Username and password are required.';
          error.classList.remove('is-hidden');
          return;
        }

        const res = await fetch(`${BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const payload = await res.json();
        if (!res.ok) {
          const code = payload?.error?.code;
          error.textContent = code === 'INVALID_CREDENTIALS' ? 'Invalid credentials' : (payload?.error?.message || 'Sign in failed.');
          error.classList.remove('is-hidden');
          return;
        }
        message.textContent = `Welcome back, ${payload.data.user.username}.`;
        if (typeof onAuthSuccess === 'function') {
          onAuthSuccess({ token: payload.data.token, user: payload.data.user });
        }
        return;
      }

      const username = form.querySelector('#signup-username').value.trim();
      const email = form.querySelector('#signup-email').value.trim();
      const password = form.querySelector('#signup-password').value;
      const confirm = form.querySelector('#signup-confirm').value;

        if (!username || !email || !password) {
          error.textContent = 'Username, email, and password are required.';
          error.classList.remove('is-hidden');
          return;
        }

        if (password !== confirm) {
          error.textContent = 'Passwords do not match.';
          error.classList.remove('is-hidden');
          return;
        }

      const res = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const payload = await res.json();
      if (!res.ok) {
        const code = payload?.error?.code;
        if (code === 'USERNAME_TAKEN') {
          error.textContent = 'Username already taken';
        } else if (code === 'EMAIL_TAKEN') {
          error.textContent = 'Email already in use';
        } else if (code === 'INVALID_EMAIL') {
          error.textContent = 'Email is invalid';
        } else {
          error.textContent = payload?.error?.message || 'Sign up failed.';
        }
        error.classList.remove('is-hidden');
        return;
      }
      message.textContent = `Account created for ${payload.data.user.username}.`;
    } catch (err) {
      error.textContent = 'Network error. Try again.';
      error.classList.remove('is-hidden');
    }
  });

  panel.appendChild(heading);
  panel.appendChild(toggle);
  panel.appendChild(form);
  container.appendChild(panel);

  return container;
};
