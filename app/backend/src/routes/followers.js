const express = require('express');
const router = express.Router();
const followersController = require('../controllers/followers');
const auth = require('../middleware/auth');

router.get('/', auth, followersController.listFollowers);

module.exports = router;
