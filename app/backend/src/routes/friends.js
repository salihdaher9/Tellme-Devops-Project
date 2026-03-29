const express = require('express');
const router = express.Router();
const friendsController = require('../controllers/friends');
const auth = require('../middleware/auth');

router.get('/', auth, friendsController.listFriends);

router.post('/', auth, friendsController.createFriend);
router.delete('/:id', auth, friendsController.deleteFriend);

module.exports = router;
