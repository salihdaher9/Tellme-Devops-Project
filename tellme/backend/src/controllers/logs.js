const logsService = require('../services/logs');

const createLog = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { movieId, rating, review } = req.body || {};
    const log = await logsService.createLog({ username, movieId, rating, review });
    res.status(201).json({ data: { log }, meta: {} });
  } catch (err) {
    next(err);
  }
};

const listLogs = async (req, res, next) => {
  try {
    const viewerUsername = req.user?.username;
    const username = req.query?.username || viewerUsername;
    const logs = await logsService.listLogs({ username, viewerUsername });
    res.status(200).json({ data: { logs }, meta: { count: logs.length } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLog,
  listLogs
};
