const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');
router.get('/', async (req, res) => {
  try {
    await metricsService.updateDbMetrics();
    res.setHeader('Content-Type', metricsService.registry.contentType);
    return res.end(await metricsService.registry.metrics());
  } catch (err) {
    const code = err.code || 'METRICS_UNAVAILABLE';
    const message = err.message || 'Telemetry unavailable';
    console.error('metrics telemetry failed', { code, message });
    metricsService.recordError(code);
    return res.status(err.status || 503).end();
  }
});

module.exports = router;
