const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendations');
const auth = require('../middleware/auth');

router.post('/', auth, recommendationsController.createRecommendations);

module.exports = router;
