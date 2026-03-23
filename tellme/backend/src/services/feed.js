const friendModel = require('../models/friend');
const userModel = require('../models/user');
const logModel = require('../models/log');
const movieModel = require('../models/movie');
const { log } = require('../utils/logger');

const listFeed = async ({ username, limit = 10 }) => {
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
  if (!friends.length) return [];

  const friendIds = friends.map((f) => f.friendId);
  const friendUsers = await userModel.findByIds(friendIds);
  const friendById = new Map(friendUsers.map((u) => [u._id.toString(), {
    username: u.username,
    avatarUrl: u.avatarUrl || '',
    email: u.email || ''
  }]));

  const logs = await logModel.listLogsByUsers({ userIds: friendIds });
  if (!logs.length) return [];

  logs.sort((a, b) => b.createdAt - a.createdAt);
  const topLogs = logs.slice(0, limit);
  log('debug', 'feed.list', { username: user.username, friendsCount: friends.length, logCount: logs.length, limit });

  const movieIds = Array.from(new Set(topLogs.map((l) => l.movieId.toString())));
  const movies = movieIds.length ? await movieModel.findByIds(movieIds) : [];
  const movieById = new Map(movies.map((m) => [m._id.toString(), m]));

  return topLogs.map((log) => {
    const friend = friendById.get(log.userId.toString());
    const movie = movieById.get(log.movieId.toString());
    return {
      username: friend?.username || 'unknown',
      avatarUrl: friend?.avatarUrl || '',
      email: friend?.email || '',
      title: movie?.title || 'Unknown',
      rating: log.rating,
      date: log.createdAt,
      posterUrl: movie?.posterUrl || '',
      review: log.review || ''
    };
  });
};

module.exports = {
  listFeed
};
