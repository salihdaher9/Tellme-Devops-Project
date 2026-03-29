const recommendationsService = require('../services/recommendations');

const createRecommendations = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { friendUsernames, genre } = req.body || {};
    const recs = await recommendationsService.recommend({ username, friendUsernames, genre });
    res.status(200).json({ data: recs, meta: { count: recs.primary ? 1 + recs.secondary.length : 0 } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRecommendations
};
