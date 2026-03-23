const createServerRunner = (app) => async (handler) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    return await handler(baseUrl);
  } catch (err) {
    console.error('withServer handler failed:', err);
    throw err;
  } finally {
    server.close();
  }
};

module.exports = { createServerRunner };
