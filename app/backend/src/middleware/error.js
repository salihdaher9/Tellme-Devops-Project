const metricsService = require('../services/metricsService');
const { log } = require('../utils/logger');

module.exports = (err, req, res, next) => {
  const safePath = `${req.method} ${req.originalUrl || req.url || ''}`.trim();
  const meta = {
    requestId: req.requestId,
    path: safePath,
    code: err.code,
    status: err.status,
    message: err.message
  };
  if (process.env.LOG_STACK === 'true' && err?.stack) {
    meta.stack = err.stack;
  }
  log('error', 'http.error', meta);
  try {
    metricsService.recordError(err.code || 'SERVER_ERROR');
  } catch (serviceErr) {
    console.warn('failed to record error metric', serviceErr);
  }
  const status = err.status || 500;
  const code = err.code || 'SERVER_ERROR';
  const message = err.message || 'Unexpected error';
  res.status(status).json({ error: { code, message } });
};
