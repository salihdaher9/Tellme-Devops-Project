const jwt = require('jsonwebtoken');
const { log } = require('../utils/logger');

module.exports = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    log('warn', 'auth.missing_token', { requestId: req.requestId, path: req.originalUrl || req.url || '' });
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    log('warn', 'auth.invalid_token', { requestId: req.requestId, path: req.originalUrl || req.url || '' });
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  }
};
