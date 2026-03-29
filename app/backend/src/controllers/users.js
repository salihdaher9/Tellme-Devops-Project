const usersService = require('../services/users');

const findUsers = async (req, res, next) => {
  try {
    const { username } = req.query || {};
    const result = await usersService.lookupUser(username?.trim());
    res.status(200).json({ data: { user: result.user }, meta: { exists: result.exists } });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    const user = await usersService.registerUser({ username, email, password });
    res.status(201).json({ data: { user }, meta: {} });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;
    const viewerUsername = req.user?.username;
    const profile = await usersService.getProfileByUsername({ username, viewerUsername });
    res.status(200).json({ data: profile, meta: {} });
  } catch (err) {
    next(err);
  }
};

const deleteSelf = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const result = await usersService.deleteSelf({ username });
    res.status(200).json({ data: result, meta: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  findUsers,
  createUser,
  getProfile,
  deleteSelf
};
