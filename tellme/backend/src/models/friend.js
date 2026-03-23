const { mongoose } = require('../utils/db');

const friendSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    friendId: { type: mongoose.Schema.Types.ObjectId, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { collection: 'friends' }
);

const Friend = mongoose.models.Friend || mongoose.model('Friend', friendSchema);

const findFriend = async ({ userId, friendId }) => {
  return Friend.findOne({ userId, friendId }).exec();
};

const createFriend = async ({ userId, friendId }) => {
  const doc = await Friend.create({ userId, friendId });
  return doc.toObject();
};

const listFriends = async ({ userId }) => {
  return Friend.find({ userId }).exec();
};

const listFollowers = async ({ friendId }) => {
  return Friend.find({ friendId }).exec();
};

const removeFriend = async ({ userId, friendId }) => {
  return Friend.deleteOne({ userId, friendId }).exec();
};

const removeFriendById = async ({ userId, friendRecordId }) => {
  return Friend.deleteOne({ _id: friendRecordId, userId }).exec();
};

const removeByUserId = async ({ userId }) => {
  return Friend.deleteMany({ userId }).exec();
};

const removeByFriendId = async ({ friendId }) => {
  return Friend.deleteMany({ friendId }).exec();
};

module.exports = {
  findFriend,
  createFriend,
  listFriends,
  listFollowers,
  removeFriend,
  removeFriendById,
  removeByUserId,
  removeByFriendId
};
