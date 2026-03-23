const bcrypt = require('bcrypt');
const userModel = require('../models/user');
const logModel = require('../models/log');
const { log } = require('../utils/logger');

const SALT_ROUNDS = 10;

const registerUser = async ({ username, email, password }) => {
  if (!username || !email || !password) {
    const error = new Error('Username, email, and password are required');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }
  const emailValue = email.trim().toLowerCase();
  const emailMatch = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue);
  if (!emailMatch) {
    const error = new Error('Email is invalid');
    error.code = 'INVALID_EMAIL';
    error.status = 400;
    throw error;
  }

  const existing = await userModel.findByUsername(username);
  if (existing) {
    const error = new Error('Username already taken');
    error.code = 'USERNAME_TAKEN';
    error.status = 409;
    throw error;
  }
  const existingEmail = await userModel.findByEmail(emailValue);
  if (existingEmail) {
    const error = new Error('Email already in use');
    error.code = 'EMAIL_TAKEN';
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userModel.createUser({ username, email: emailValue, passwordHash });
  log('info', 'user.registered', {
    userId: user._id?.toString?.() || null,
    username: user.username,
    emailDomain: emailValue.split('@')[1] || null
  });
  return { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl || '', createdAt: user.createdAt };
};

const lookupUser = async (username) => {
  if (!username) {
    const error = new Error('Username is required');
    error.code = 'USERNAME_REQUIRED';
    error.status = 400;
    throw error;
  }
  const user = await userModel.findByUsernameInsensitive(username);
  if (!user) {
    log('info', 'user.lookup.miss', { username });
    return { user: null, exists: false };
  }
  log('debug', 'user.lookup.hit', { username: user.username });
  return { user: { _id: user._id, username: user.username, avatarUrl: user.avatarUrl || '' }, exists: true };
};

const getProfileByUsername = async ({ username, viewerUsername }) => {
  if (!username) {
    const error = new Error('username is required');
    error.code = 'USERNAME_REQUIRED';
    error.status = 400;
    throw error;
  }
  const user = await userModel.findByUsernameInsensitive(username);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  if (viewerUsername && viewerUsername.toLowerCase() !== username.toLowerCase()) {
    const viewer = await userModel.findByUsernameInsensitive(viewerUsername);
    if (!viewer) {
      const error = new Error('User not found');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }
    const friendModel = require('../models/friend');
    const friendship = await friendModel.findFriend({ userId: viewer._id, friendId: user._id });
    if (!friendship) {
      const error = new Error('Not authorized to view profile');
      error.code = 'NOT_FRIENDS';
      error.status = 403;
      throw error;
    }
  }
  const logs = await logModel.listLogs({ userId: user._id });
  const count = logs.length;
  const avg = count ? (logs.reduce((sum, l) => sum + l.rating, 0) / count) : 0;
  log('info', 'profile.viewed', {
    username: user.username,
    viewer: viewerUsername || user.username,
    logCount: count
  });
  return {
    user: {
      username: user.username,
      avatarUrl: user.avatarUrl || '',
      stats: {
        totalLogs: count,
        averageRating: Number(avg.toFixed(2))
      }
    }
  };
};

const deleteSelf = async ({ username }) => {
  if (!username) {
    const error = new Error('Username is required');
    error.code = 'USERNAME_REQUIRED';
    error.status = 400;
    throw error;
  }
  const user = await userModel.findByUsernameInsensitive(username);
  if (!user) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const friendModel = require('../models/friend');
  await Promise.all([
    logModel.deleteByUserId({ userId: user._id }),
    friendModel.removeByUserId({ userId: user._id }),
    friendModel.removeByFriendId({ friendId: user._id })
  ]);
  await userModel.deleteById({ userId: user._id });

  log('info', 'user.deleted', { userId: user._id?.toString?.() || null, username: user.username });
  return { deleted: true };
};

module.exports = {
  registerUser,
  lookupUser,
  getProfileByUsername,
  deleteSelf
};
