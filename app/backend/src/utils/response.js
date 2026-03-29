const ok = (res, data, meta = {}) => {
  return res.status(200).json({ data, meta });
};

const error = (res, { status = 500, code = 'SERVER_ERROR', message = 'Unexpected error' } = {}) => {
  return res.status(status).json({ error: { code, message } });
};

module.exports = {
  ok,
  error
};
