const express = require('express');
const router = express.Router();
const sessionsController = require('../controllers/sessions');

router.post('/', sessionsController.createSession);
router.delete('/', sessionsController.deleteSession);

module.exports = router;
