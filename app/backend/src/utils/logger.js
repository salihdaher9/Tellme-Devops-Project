const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const getMinLevel = () => {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return levels[raw] ?? levels.info;
};

const baseMeta = () => ({
  service: process.env.SERVICE_NAME || 'tellme-backend',
  env: process.env.NODE_ENV || 'development'
});

const log = (level, message, meta = {}) => {
  const minLevel = getMinLevel();
  if ((levels[level] ?? levels.info) < minLevel) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...baseMeta(),
    ...meta
  };
  console.log(JSON.stringify(payload));
};

const child = (meta = {}) => ({
  log: (level, message, extra = {}) => log(level, message, { ...meta, ...extra })
});

module.exports = {
  log,
  child
};
