const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const auth = require('../middleware/auth');

router.get('/', auth, usersController.findUsers);
router.get('/:username', auth, usersController.getProfile);

router.post('/', usersController.createUser);
router.delete('/me', auth, usersController.deleteSelf);

module.exports = router;
