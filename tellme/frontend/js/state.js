export const state = {
  activeView: 'feed',
  isAuthenticated: false,
  auth: null,
  token: null,
  pickForMeSelections: { friends: [], genre: '' }
};

export const loadAuthFromStorage = () => {
  const raw = window.localStorage.getItem('auth');
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.token) {
      state.token = parsed.token;
      state.auth = parsed.user || null;
      state.isAuthenticated = true;
    }
  } catch {
    // ignore invalid storage
  }
};

export const clearAuthStorage = () => {
  window.localStorage.removeItem('auth');
};

export const setActiveView = (view) => {
  state.activeView = view;
};
