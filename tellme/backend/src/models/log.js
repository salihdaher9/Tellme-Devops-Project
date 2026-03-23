const { mongoose } = require('../utils/db');

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    movieId: { type: mongoose.Schema.Types.ObjectId, required: true },
    rating: { type: Number, required: true },
    review: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'logs' }
);

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);

const createLog = async ({ userId, movieId, rating, review = '' }) => {
  const doc = await Log.create({ userId, movieId, rating, review });
  return doc.toObject();
};

const listLogs = async ({ userId }) => {
  return Log.find({ userId }).sort({ createdAt: -1 }).exec();
};

const listLogsByUsers = async ({ userIds }) => {
  return Log.find({ userId: { $in: userIds } }).exec();
};

const listLogsByMovie = async ({ movieId }) => {
  return Log.find({ movieId }).sort({ createdAt: -1 }).exec();
};

const deleteByUserId = async ({ userId }) => {
  return Log.deleteMany({ userId }).exec();
};

module.exports = {
  createLog,
  listLogs,
  listLogsByUsers,
  listLogsByMovie,
  deleteByUserId
};
