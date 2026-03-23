const friendModel = require('../models/friend');
const userModel = require('../models/user');
const logModel = require('../models/log');
const movieModel = require('../models/movie');
const { log } = require('../utils/logger');

const addFriend = async ({ username, friendUsername }) => {
  if (!username || !friendUsername) {
    const error = new Error('Username and friendUsername are required');
    error.code = 'VALIDATION_ERROR';
    error.status = 400;
    throw error;
  }

  if (username.toLowerCase() === friendUsername.toLowerCase()) {
    const error = new Error('Cannot add self');
    error.code = 'CANNOT_ADD_SELF';
    error.status = 400;
    throw error;
  }

  const user = await userModel.findByUsernameInsensitive(username);
  const friend = await userModel.findByUsernameInsensitive(friendUsername);

  if (!user || !friend) {
    const error = new Error('User not found');
    error.code = 'USER_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const existing = await friendModel.findFriend({ userId: user._id, friendId: friend._id });
  if (existing) {
    const error = new Error('Friend already added');
    error.code = 'FRIEND_ALREADY_ADDED';
    error.status = 409;
    throw error;
  }

  const record = await friendModel.createFriend({ userId: user._id, friendId: friend._id });
  log('info', 'friend.added', {
    userId: user._id.toString(),
    username: user.username,
    friendId: friend._id.toString(),
    friendUsername: friend.username
  });
  return { friend: { _id: friend._id, username: friend.username }, recordId: record.id };
};

const listFriends = async ({ username }) => {
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

  const friends = await friendModel.listFriends({ userId: user._id });
  if (!friends.length) {
    return { friends: [], count: 0 };
  }

  const friendIds = friends.map((f) => f.friendId);
  const friendUsers = await userModel.findByIds(friendIds);
  const byId = new Map(friendUsers.map((u) => [u._id.toString(), { username: u.username, avatarUrl: u.avatarUrl || '' }]));

  const list = friends.map((f) => {
    const meta = byId.get(f.friendId.toString());
    return {
      id: f._id.toString(),
      username: meta?.username || 'unknown',
      avatarUrl: meta?.avatarUrl || ''
    };
  });
  log('debug', 'friends.list', { username: user.username, count: list.length });
  return { friends: list, count: list.length };
};

const listFollowers = async ({ username }) => {
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

  const followers = await friendModel.listFollowers({ friendId: user._id });
  if (!followers.length) {
    return { followers: [], count: 0 };
  }

  const followerIds = followers.map((f) => f.userId);
  const followerUsers = await userModel.findByIds(followerIds);
  const byId = new Map(followerUsers.map((u) => [u._id.toString(), { username: u.username, avatarUrl: u.avatarUrl || '', email: u.email || '' }]));

  const list = followers.map((f) => {
    const meta = byId.get(f.userId.toString());
    return {
      id: f._id.toString(),
      username: meta?.username || 'unknown',
      avatarUrl: meta?.avatarUrl || '',
      email: meta?.email || ''
    };
  });
  log('debug', 'followers.list', { username: user.username, count: list.length });
  return { followers: list, count: list.length };
};

const removeFriend = async ({ username, friendRecordId }) => {
  if (!username || !friendRecordId) {
    const error = new Error('username and friendRecordId are required');
    error.code = 'VALIDATION_ERROR';
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

  const result = await friendModel.removeFriendById({ userId: user._id, friendRecordId });
  if (result.deletedCount === 0) {
    const error = new Error('Friend not found');
    error.code = 'FRIEND_NOT_FOUND';
    error.status = 404;
    throw error;
  }
  log('info', 'friend.removed', { username: user.username, friendRecordId });
  return { removed: true };
};

module.exports = {
  addFriend,
  listFriends,
  listFollowers,
  removeFriend
};
