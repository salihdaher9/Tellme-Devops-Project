const dbClient = require('./services/dbClient');
const { createApp } = require('./app');
const { log } = require('./utils/logger');

const app = createApp();
const port = process.env.PORT || 3000;

dbClient.connect()
  .then(() => {
    dbClient.mongoose.connection.on('error', (err) => {
      log('error', 'db.connection.error', { message: err.message });
    });
    dbClient.mongoose.connection.on('disconnected', () => {
      log('warn', 'db.connection.disconnected');
    });
    app.listen(port, () => {
      log('info', 'server.listening', { port });
    });
  })
  .catch((err) => {
    log('error', 'db.connection.failed', { message: err.message });
    process.exit(1);
  });
