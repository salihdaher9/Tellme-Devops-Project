const metricsService = require('../services/metricsService');

module.exports = (req, res, next) => {
  const startNs = process.hrtime.bigint();
  try {
    metricsService.incrementRequest();
  } catch (err) {
    console.warn('metrics increment failed', err);
  }
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startNs) / 1e9;
    const route = req.route && req.route.path
      ? `${req.baseUrl || ''}${req.route.path}`
      : (req.baseUrl || req.path || 'unknown');
    const status = res.statusCode ? String(res.statusCode) : '0';
    const contentLength = res.getHeader('content-length');
    const responseSizeBytes = contentLength ? Number(contentLength) : undefined;
    try {
      metricsService.observeRequest({
        method: req.method,
        route,
        status,
        durationSeconds,
        responseSizeBytes
      });
      metricsService.decrementRequest();
    } catch (err) {
      console.warn('metrics observe failed', err);
    }
  });
  next();
};
