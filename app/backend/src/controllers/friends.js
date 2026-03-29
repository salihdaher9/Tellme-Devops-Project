const friendsService = require('../services/friends');

const listFriends = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const result = await friendsService.listFriends({ username });
    res.status(200).json({ data: { friends: result.friends }, meta: { count: result.count } });
  } catch (err) {
    next(err);
  }
};

const createFriend = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { friendUsername } = req.body || {};
    const result = await friendsService.addFriend({ username, friendUsername });
    res.status(201).json({ data: { friend: result.friend }, meta: {} });
  } catch (err) {
    next(err);
  }
};

const deleteFriend = async (req, res, next) => {
  try {
    const username = req.user?.username;
    const { id } = req.params;
    const result = await friendsService.removeFriend({ username, friendRecordId: id });
    res.status(200).json({ data: { removed: result.removed }, meta: {} });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listFriends,
  createFriend,
  deleteFriend
};
