import { state, setActiveView, loadAuthFromStorage, clearAuthStorage } from './state.js';
import { BASE_URL } from './config.js';
import { renderHome } from './views/home.js';
import { renderLogs } from './views/log.js';
import { renderFollowing } from './views/friends.js';
import { renderAuth } from './views/auth.js';
import { renderFollowers } from './views/followers.js';

const viewRoot = document.getElementById('view-root');
const tabs = document.querySelectorAll('.tab');
const signOutBtn = document.getElementById('signout');
const deleteAccountBtn = document.getElementById('delete-account');
const userChip = document.getElementById('user-chip');
const header = document.querySelector('.app-header');
const updateUserChip = () => {
  if (!userChip) return;
  userChip.textContent = state.auth?.email || '';
};

export const renderApp = () => {
  viewRoot.innerHTML = '';
  if (header) {
    header.classList.toggle('is-auth', state.isAuthenticated);
  }
  if (!state.isAuthenticated) {
    if (signOutBtn) signOutBtn.classList.add('is-hidden');
    if (deleteAccountBtn) deleteAccountBtn.classList.add('is-hidden');
    if (userChip) userChip.textContent = '';
    viewRoot.appendChild(renderAuth({
      requireAuthMessage: true,
      onAuthSuccess: ({ token, user }) => {
        state.isAuthenticated = true;
        state.token = token;
        state.auth = user;
        window.localStorage.setItem('auth', JSON.stringify({ token, user }));
        setActiveTab();
        renderApp();
      }
    }));
    return;
  }
  if (signOutBtn) signOutBtn.classList.remove('is-hidden');
  if (deleteAccountBtn) deleteAccountBtn.classList.remove('is-hidden');
  let view;
  switch (state.activeView) {
    case 'logs':
      view = renderLogs();
      break;
    case 'following':
      view = renderFollowing();
      break;
    case 'followers':
      view = renderFollowers();
      break;
      break;
    case 'feed':
    default:
      view = renderHome();
  }
  viewRoot.appendChild(view);
  updateUserChip();
};

const setActiveTab = () => {
  tabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.view === state.activeView);
  });
};

window.addEventListener('app:navigate', () => {
  setActiveTab();
  renderApp();
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (!state.isAuthenticated) {
      renderApp();
      return;
    }
    setActiveView(tab.dataset.view);
    setActiveTab();
    renderApp();
  });
});

setActiveTab();
loadAuthFromStorage();
renderApp();

const handleSignOut = async () => {
  const headers = state.token ? { Authorization: `Bearer ${state.token}` } : {};
  try {
    await fetch(`${BASE_URL}/api/sessions`, { method: 'DELETE', headers });
  } catch (err) {
    console.warn('Sign out failed', err);
  } finally {
    state.isAuthenticated = false;
    state.auth = null;
    state.token = null;
    clearAuthStorage();
    renderApp();
  }
};

const handleDeleteAccount = async () => {
  if (!state.token) return;
  const confirmed = window.confirm('Delete your account permanently? This cannot be undone.');
  if (!confirmed) return;
  const headers = { Authorization: `Bearer ${state.token}` };
  try {
    const res = await fetch(`${BASE_URL}/api/users/me`, { method: 'DELETE', headers });
    if (!res.ok) {
      console.warn('Delete account failed', await res.json());
      return;
    }
  } catch (err) {
    console.warn('Delete account failed', err);
    return;
  }
  state.isAuthenticated = false;
  state.auth = null;
  state.token = null;
  clearAuthStorage();
  renderApp();
};

if (signOutBtn) {
  signOutBtn.addEventListener('click', handleSignOut);
}

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener('click', handleDeleteAccount);
}
