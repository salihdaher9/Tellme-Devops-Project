const friendsService = require('../services/friends');

const listFollowers = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const result = await friendsService.listFollowers({ username });
    res.status(200).json({ data: { followers: result.followers }, meta: { count: result.count } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listFollowers
};
