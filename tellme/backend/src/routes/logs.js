const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs');
const auth = require('../middleware/auth');

router.get('/', auth, logsController.listLogs);
router.post('/', auth, logsController.createLog);

module.exports = router;
