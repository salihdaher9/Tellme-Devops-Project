const { randomUUID } = require('node:crypto');
const { log } = require('../utils/logger');

const pickIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || null;
};

module.exports = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  req.requestStart = Date.now();
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - req.requestStart;
    log('info', 'http.request', {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url || '',
      status: res.statusCode,
      durationMs,
      user: req.user?.username || null,
      userId: req.user?.sub || null,
      ip: pickIp(req),
      userAgent: req.headers['user-agent'] || null
    });
  });

  next();
};
