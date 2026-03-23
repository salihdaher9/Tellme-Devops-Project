const client = require('prom-client');
const dbClient = require('./dbClient');

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

const requestsTotal = new client.Counter({
  name: 'app_requests_total',
  help: 'Total number of HTTP requests received by the app.',
  labelNames: ['method', 'route', 'status'],
  registers: [registry]
});

const requestDuration = new client.Histogram({
  name: 'app_request_duration_seconds',
  help: 'HTTP request duration in seconds.',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry]
});

const requestSizeBytes = new client.Histogram({
  name: 'app_response_size_bytes',
  help: 'HTTP response size in bytes.',
  labelNames: ['method', 'route', 'status'],
  buckets: [200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000],
  registers: [registry]
});

const inFlightRequests = new client.Gauge({
  name: 'app_requests_in_flight',
  help: 'Number of HTTP requests currently being handled.',
  registers: [registry]
});

const errorsTotal = new client.Counter({
  name: 'app_errors_total',
  help: 'Total number of application errors.',
  labelNames: ['code'],
  registers: [registry]
});

const dbConnected = new client.Gauge({
  name: 'app_db_connected',
  help: 'Database connection status (1 = connected, 0 = disconnected).',
  registers: [registry]
});

const dbLatencyMs = new client.Gauge({
  name: 'app_db_latency_ms',
  help: 'Database ping latency in milliseconds.',
  registers: [registry]
});

const incrementRequest = () => {
  inFlightRequests.inc();
};

const decrementRequest = () => {
  inFlightRequests.dec();
};

const observeRequest = ({ method, route, status, durationSeconds, responseSizeBytes }) => {
  const labels = {
    method: method || 'UNKNOWN',
    route: route || 'unknown',
    status: status || '0'
  };
  requestsTotal.inc(labels);
  requestDuration.observe(labels, durationSeconds || 0);
  if (Number.isFinite(responseSizeBytes)) {
    requestSizeBytes.observe(labels, responseSizeBytes);
  }
};

const recordError = (code) => {
  errorsTotal.inc({ code: code || 'UNKNOWN_ERROR' });
};

const updateDbMetrics = async () => {
  const snapshot = await dbClient.checkConnection();
  if (!snapshot || snapshot.status !== 'connected') {
    dbConnected.set(0);
    dbLatencyMs.set(0);
    return;
  }
  dbConnected.set(1);
  dbLatencyMs.set(snapshot.latencyMs || 0);
};

module.exports = {
  incrementRequest,
  decrementRequest,
  observeRequest,
  recordError,
  updateDbMetrics,
  registry
};
