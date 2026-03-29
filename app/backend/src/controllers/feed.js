const feedService = require('../services/feed');

const listFeed = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const feed = await feedService.listFeed({ username });
    res.status(200).json({ data: { feed }, meta: { count: feed.length } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listFeed
};
