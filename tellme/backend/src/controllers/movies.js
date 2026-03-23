const moviesService = require('../services/movies');

const listMovies = async (req, res, next) => {
  try {
    const movies = await moviesService.listMovies();
    res.status(200).json({ data: { movies }, meta: { count: movies.length } });
  } catch (err) {
    next(err);
  }
};

const getMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const viewerUsername = req.user?.username;
    const movie = await moviesService.getMovieById(id, viewerUsername);
    res.status(200).json({ data: { movie }, meta: {} });
  } catch (err) {
    next(err);
  }
};

const seedHealth = async (req, res, next) => {
  try {
    const count = await moviesService.countMovies();
    if (count === 0) {
      return res.status(500).json({ error: { code: 'SEED_MISSING', message: 'No movies seeded' } });
    }
    return res.status(200).json({ data: { seeded: true }, meta: { count } });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listMovies,
  getMovie,
  seedHealth
};
