const sessionsService = require('../services/sessions');

const createSession = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const { user, token } = await sessionsService.createSession({ username, password });
    res.status(201).json({ data: { user, token }, meta: {} });
  } catch (err) {
    next(err);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    res.status(200).json({ data: { signedOut: true }, meta: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSession,
  deleteSession
};
