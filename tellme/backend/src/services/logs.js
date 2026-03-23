const logModel = require('../models/log');
const userModel = require('../models/user');
const movieModel = require('../models/movie');
const friendModel = require('../models/friend');
const { log } = require('../utils/logger');

const createLog = async ({ username, movieId, rating, review }) => {
  if (!username || !movieId || rating == null) {
    const error = new Error('username, movieId, and rating are required');
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

  const movie = await movieModel.findMovieById(movieId);
  if (!movie) {
    const error = new Error('Movie not found');
    error.code = 'MOVIE_NOT_FOUND';
    error.status = 404;
    throw error;
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
    const error = new Error('Rating must be between 0 and 5');
    error.code = 'INVALID_RATING';
    error.status = 400;
    throw error;
  }

  const reviewText = typeof review === 'string' ? review.trim() : '';
  if (reviewText.length > 500) {
    const error = new Error('Review must be 500 characters or less');
    error.code = 'REVIEW_TOO_LONG';
    error.status = 400;
    throw error;
  }

  const createdLog = await logModel.createLog({
    userId: user._id,
    movieId: movie._id,
    rating: numericRating,
    review: reviewText
  });
  log('info', 'log.created', {
    userId: user._id.toString(),
    username: user.username,
    movieId: movie._id.toString(),
    movieTitle: movie.title || 'Unknown',
    rating: numericRating,
    reviewLength: reviewText.length
  });
  return { id: createdLog._id, movieId: createdLog.movieId, rating: createdLog.rating, review: createdLog.review || '' };
};

const listLogs = async ({ username, viewerUsername }) => {
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
    const friendship = await friendModel.findFriend({ userId: viewer._id, friendId: user._id });
    if (!friendship) {
      const error = new Error('Not authorized to view logs');
      error.code = 'NOT_FRIENDS';
      error.status = 403;
      throw error;
    }
  }

  const logs = await logModel.listLogs({ userId: user._id });
  if (!logs.length) return [];
  log('debug', 'log.list', { username: user.username, count: logs.length, viewer: viewerUsername || user.username });

  const movieIds = logs.map((l) => l.movieId);
  const movies = await movieModel.findByIds(movieIds);
  const byId = new Map(movies.map((m) => [m._id.toString(), m]));

  return logs.map((log) => {
    const movieId = log.movieId?.toString?.() || null;
    const movie = movieId ? byId.get(movieId) : null;
    return {
      id: log._id.toString(),
      movieId,
      title: movie?.title || 'Unknown',
      posterUrl: movie?.posterUrl || '',
      rating: log.rating,
      review: log.review || '',
      date: log.createdAt
    };
  });
};

module.exports = {
  createLog,
  listLogs
};
