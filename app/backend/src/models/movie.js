const { mongoose } = require('../utils/db');

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    posterUrl: { type: String, default: '' }
  },
  { collection: 'movies' }
);

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

const listMovies = async () => {
  return Movie.find({}).sort({ title: 1 }).exec();
};

const findMovieById = async (id) => {
  return Movie.findById(id).exec();
};

const findByIds = async (ids) => {
  return Movie.find({ _id: { $in: ids } }).exec();
};

const countMovies = async () => {
  return Movie.countDocuments({}).exec();
};

module.exports = {
  listMovies,
  findMovieById,
  findByIds,
  countMovies
};
