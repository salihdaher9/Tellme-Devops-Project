const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed');
const auth = require('../middleware/auth');

router.get('/', auth, feedController.listFeed);

module.exports = router;
