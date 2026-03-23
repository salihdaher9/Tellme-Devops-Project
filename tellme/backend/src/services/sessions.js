const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user');
const { log } = require('../utils/logger');

const createSession = async ({ username, password }) => {
  if (!username || !password) {
    const error = new Error('Username and password are required');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  const user = await userModel.findByUsername(username);
  if (!user) {
    log('warn', 'auth.login.failed', { username, reason: 'USER_NOT_FOUND' });
    const error = new Error('Invalid credentials');
    error.code = 'INVALID_CREDENTIALS';
    error.status = 401;
    throw error;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    log('warn', 'auth.login.failed', { username, reason: 'BAD_PASSWORD' });
    const error = new Error('Invalid credentials');
    error.code = 'INVALID_CREDENTIALS';
    error.status = 401;
    throw error;
  }

  const secret = process.env.JWT_SECRET || 'dev-secret';
  const token = jwt.sign(
    { sub: user._id.toString(), username: user.username, email: user.email },
    secret
  );
  log('info', 'auth.login.success', { userId: user._id.toString(), username: user.username });
  return { token, user: { username: user.username, email: user.email || '' } };
};

module.exports = {
  createSession
};
