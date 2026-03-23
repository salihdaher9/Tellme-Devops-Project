const { connectDb, mongoose } = require('../utils/db');

let lastLatencyMs = null;

const connect = async () => {
  await connectDb();
};

const checkConnection = async () => {
  const snapshot = {
    status: 'disconnected',
    latencyMs: null,
    lastCheckedAt: new Date().toISOString()
  };

  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return snapshot;
  }

  const start = Date.now();
  try {
    const admin = mongoose.connection.db.admin && mongoose.connection.db.admin();
    if (admin && typeof admin.ping === 'function') {
      await admin.ping();
    }
    const duration = Date.now() - start;
    lastLatencyMs = duration;
    return {
      status: 'connected',
      latencyMs: duration,
      lastCheckedAt: snapshot.lastCheckedAt
    };
  } catch (err) {
    console.warn('dbClient ping failed', err);
    return snapshot;
  }
};

module.exports = {
  connect,
  mongoose,
  checkConnection,
  getLastLatency: () => lastLatencyMs
};
