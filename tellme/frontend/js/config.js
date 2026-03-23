const browserConfig = (typeof window !== 'undefined' && window.__APP_CONFIG__)
  ? window.__APP_CONFIG__
  : null;
const globalConfig = (browserConfig || globalThis.__APP_CONFIG__ || {});
export const BASE_URL = (globalConfig.API_BASE_URL || '').replace(/\/$/, '');
