const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/movies');
const auth = require('../middleware/auth');

router.get('/', auth, moviesController.listMovies);

router.get('/:id', auth, moviesController.getMovie);

module.exports = router;
