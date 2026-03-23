const mongoose = require('mongoose');
const { log } = require('./logger');

const buildMongoUrl = () => {
  const url = process.env.MONGO_URL || 'mongodb://db:27017';
  const dbName = process.env.MONGO_DB || 'pick-for-me';
  const user = process.env.MONGO_USER;
  const password = process.env.MONGO_PASSWORD;
  const authSource = process.env.MONGO_AUTH_SOURCE;
  if (user && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password);
    const auth = `${encodedUser}:${encodedPassword}@`;
    const authDb = authSource ? `?authSource=${encodeURIComponent(authSource)}` : '';
    const base = url.replace('mongodb://', `mongodb://${auth}`);
    return `${base}/${dbName}${authDb}`;
  }
  return `${url}/${dbName}`;
};

let connected = false;

const connectDb = async () => {
  if (connected) return;
  const debug = process.env.MONGO_DEBUG === 'true';
  if (debug) {
    mongoose.set('debug', true);
  }
  log('info', 'db.connect.start', { dbName: process.env.MONGO_DB || 'pick-for-me' });
  await mongoose.connect(buildMongoUrl(), {
    autoIndex: true
  });
  connected = true;
  log('info', 'db.connect.ready', { host: mongoose.connection?.host || null });
};

module.exports = {
  connectDb,
  mongoose,
  buildMongoUrl
};
