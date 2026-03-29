import { JSDOM } from 'jsdom';

let dom;

export const setupDom = (html = '') => {
  dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url: 'http://localhost'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.HTMLElement = dom.window.HTMLElement;
  if (!window.__APP_CONFIG__) {
    window.__APP_CONFIG__ = { API_BASE_URL: 'http://api.test' };
  }
  return dom;
};

export const cleanupDom = () => {
  if (dom) {
    dom.window.close();
  }
  dom = null;
  delete global.window;
  delete global.document;
  delete global.Event;
  delete global.CustomEvent;
  delete global.HTMLElement;
};
