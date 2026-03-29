const userModel = require('../models/user');
const logModel = require('../models/log');
const movieModel = require('../models/movie');
const { log } = require('../utils/logger');

const recommend = async ({ username, friendUsernames, genre }) => {
  if (!username || !Array.isArray(friendUsernames) || friendUsernames.length === 0) {
    const error = new Error('friendUsernames is required');
    error.code = 'FRIENDS_REQUIRED';
    error.status = 400;
    throw error;
  }

  const friends = await Promise.all(
    friendUsernames.map((name) => userModel.findByUsernameInsensitive(name))
  );
  const friendUsers = friends.filter(Boolean);
  if (!friendUsers.length) {
    return { primary: null, secondary: [] };
  }

  const friendIds = friendUsers.map((u) => u._id);
  const logs = await logModel.listLogsByUsers({ userIds: friendIds });
  const user = await userModel.findByUsernameInsensitive(username);
  const userLogs = user ? await logModel.listLogs({ userId: user._id }) : [];
  const excluded = new Set(userLogs.map((l) => l.movieId.toString()));
  if (!logs.length) {
    return { primary: null, secondary: [] };
  }

  const movieIds = [...new Set(logs.map((l) => l.movieId.toString()))];
  const movies = await movieModel.findByIds(movieIds);
  const movieMap = new Map(movies.map((m) => [m._id.toString(), m]));

  const scores = new Map();
  logs.forEach((log) => {
    const movie = movieMap.get(log.movieId.toString());
    if (!movie) return;
    if (genre && movie.genre !== genre) return;
    if (excluded.has(movie._id.toString())) return;
    const current = scores.get(movie._id.toString()) || { total: 0, count: 0, movie };
    current.total += log.rating;
    current.count += 1;
    scores.set(movie._id.toString(), current);
  });

  const ranked = Array.from(scores.values())
    .sort((a, b) => (b.total / b.count) - (a.total / a.count))
    .slice(0, 3);

  const results = ranked.map((r) => ({
    id: r.movie._id.toString(),
    title: r.movie.title,
    year: r.movie.year,
    posterUrl: r.movie.posterUrl || '',
    genre: r.movie.genre
  }));

  log('info', 'recommendations.generated', {
    username,
    friendCount: friendUsers.length,
    totalLogs: logs.length,
    genre: genre || null,
    primaryId: results[0]?.id || null,
    count: results.length
  });

  return {
    primary: results[0] || null,
    secondary: results.slice(1)
  };
};

module.exports = {
  recommend
};
