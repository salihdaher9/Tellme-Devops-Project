const express = require('express');
const router = express.Router();
const moviesController = require('../controllers/movies');
const dbClient = require('../services/dbClient');

router.get('/', (req, res) => {
  res.json({ data: { status: 'ok' }, meta: {} });
});

router.get('/ready', async (req, res) => {
  const check = await dbClient.checkConnection();
  if (check.status !== 'connected') {
    return res.status(503).json({ data: { status: 'degraded', db: check }, meta: {} });
  }
  return res.json({ data: { status: 'ok', db: check }, meta: {} });
});

router.get('/seed', moviesController.seedHealth);

module.exports = router;
