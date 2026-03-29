const { mongoose } = require('../utils/db');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'users' }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const findByUsername = async (username) => {
  return User.findOne({ username }).exec();
};

const findByUsernameInsensitive = async (username) => {
  return User.findOne({ username: new RegExp(`^${username}$`, 'i') }).exec();
};

const findByEmail = async (email) => {
  return User.findOne({ email }).exec();
};

const createUser = async ({ username, email, passwordHash, avatarUrl = '' }) => {
  const doc = await User.create({ username, email, passwordHash, avatarUrl });
  return doc.toObject();
};

const findByIds = async (ids) => {
  return User.find({ _id: { $in: ids } }).exec();
};

const deleteById = async ({ userId }) => {
  return User.deleteOne({ _id: userId }).exec();
};

module.exports = {
  findByUsername,
  findByUsernameInsensitive,
  findByEmail,
  createUser,
  findByIds,
  deleteById
};
