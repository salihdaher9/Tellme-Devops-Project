const path = require('node:path');
const fs = require('node:fs');
const express = require('express');

const users = require('./routes/users');
const friends = require('./routes/friends');
const followers = require('./routes/followers');
const movies = require('./routes/movies');
const logs = require('./routes/logs');
const recommendations = require('./routes/recommendations');
const sessions = require('./routes/sessions');
const health = require('./routes/health');
const feed = require('./routes/feed');
const metrics = require('./routes/metrics');
const errorHandler = require('./middleware/error');
const auth = require('./middleware/auth');
const metricsMiddleware = require('./middleware/metrics');
const requestLogger = require('./middleware/requestLogger');

const envPath = path.join(__dirname, '..', '..', '.env');

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key && value !== undefined) {
      process.env[key] = process.env[key] || value;
    }
  });
};

try {
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
} catch {
  loadEnvFile(envPath);
}

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  app.use(metricsMiddleware);

  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
      }
      return next();
    });
  }

  // serve frontend static (local/dev)
  // serve static
  const frontendPath = path.join(__dirname, '../../frontend');
  app.use(express.static(frontendPath));



  app.use('/health', health);
  app.use('/api/health', health);
  app.use('/api/users', users);
  app.use('/api/sessions', sessions);
  app.use('/api/friends', auth, friends);
  app.use('/api/followers', auth, followers);
  app.use('/api/feed', feed);
  app.use('/api/movies', auth, movies);
  app.use('/api/logs', logs);
  app.use('/api/recommendations', recommendations);
  app.use('/metrics', metrics);
  app.use(errorHandler);

    // SPA fallback for frontend
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });


  return app;
};

module.exports = {
  createApp
};
