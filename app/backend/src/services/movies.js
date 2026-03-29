const movieModel = require('../models/movie');
const logModel = require('../models/log');
const userModel = require('../models/user');
const friendModel = require('../models/friend');
const { log } = require('../utils/logger');

const listMovies = async () => {
  const movies = await movieModel.listMovies();
  log('debug', 'movies.list', { count: movies.length });
  return movies.map((m) => ({
    _id: m._id,
    title: m.title,
    year: m.year,
    genre: m.genre,
    posterUrl: m.posterUrl || ''
  }));
};

const getMovieById = async (id, viewerUsername) => {
  if (!id) {
    const error = new Error('Movie id is required');
    error.code = 'MOVIE_ID_REQUIRED';
    error.status = 400;
    throw error;
  }
  const movie = await movieModel.findMovieById(id);
  if (!movie) {
    const error = new Error('Movie not found');
    error.code = 'MOVIE_NOT_FOUND';
    error.status = 404;
    throw error;
  }
  const logs = await logModel.listLogsByMovie({ movieId: movie._id });
  const latestByUser = new Map();
  for (const log of logs) {
    const key = log.userId.toString();
    const existing = latestByUser.get(key);
    if (!existing || log.createdAt > existing.createdAt) {
      latestByUser.set(key, log);
    }
  }
  const uniqueLogs = Array.from(latestByUser.values());
  const totalCount = uniqueLogs.length;
  const totalAvg = totalCount
    ? (uniqueLogs.reduce((sum, l) => sum + l.rating, 0) / totalCount)
    : 0;

  let friendAvg = null;
  let friendCount = 0;
  if (viewerUsername) {
    const viewer = await userModel.findByUsernameInsensitive(viewerUsername);
    if (viewer) {
      const friends = await friendModel.listFriends({ userId: viewer._id });
      const friendIds = new Set(friends.map((f) => f.friendId.toString()));
      const friendUnique = uniqueLogs.filter((l) => friendIds.has(l.userId.toString()));
      friendCount = friendUnique.length;
      friendAvg = friendCount
        ? (friendUnique.reduce((sum, l) => sum + l.rating, 0) / friendCount)
        : null;
    }
  }

  const reviewUsers = uniqueLogs.length
    ? await userModel.findByIds(Array.from(new Set(uniqueLogs.map((l) => l.userId))))
    : [];
  const userById = new Map(reviewUsers.map((u) => [u._id.toString(), u]));

  const reviews = uniqueLogs.map((log) => ({
    id: log._id.toString(),
    username: userById.get(log.userId.toString())?.username || 'unknown',
    avatarUrl: userById.get(log.userId.toString())?.avatarUrl || '',
    rating: log.rating,
    review: log.review || '',
    date: log.createdAt
  }));

  log('info', 'movie.viewed', {
    movieId: movie._id.toString(),
    title: movie.title,
    viewer: viewerUsername || null,
    overallCount: totalCount,
    friendsCount: friendCount
  });

  return {
    _id: movie._id,
    title: movie.title,
    year: movie.year,
    genre: movie.genre,
    posterUrl: movie.posterUrl || '',
    stats: {
      overallAverage: Number(totalAvg.toFixed(2)),
      overallCount: totalCount,
      friendsAverage: friendAvg == null ? null : Number(friendAvg.toFixed(2)),
      friendsCount: friendCount
    },
    reviews
  };
};

const countMovies = async () => {
  return movieModel.countMovies();
};

module.exports = {
  listMovies,
  getMovieById,
  countMovies
};
