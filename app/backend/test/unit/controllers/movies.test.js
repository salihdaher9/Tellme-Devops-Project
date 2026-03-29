const { beforeEach, afterEach, test } = require('node:test');
const assert = require('node:assert/strict');
const moviesController = require('../../../src/controllers/movies');
const moviesService = require('../../../src/services/movies');
const { createStubManager } = require('../../helpers/stub-manager');

const stubs = createStubManager();

const createRes = () => {
  let storedStatus;
  let storedBody;
  return {
    status(code) {
      storedStatus = code;
      return this;
    },
    json(payload) {
      storedBody = payload;
      return this;
    },
    get statusCode() {
      return storedStatus;
    },
    get body() {
      return storedBody;
    }
  };
};

beforeEach(() => {
  stubs.restoreAll();
});

afterEach(() => {
  stubs.restoreAll();
});

test('listMovies responds with movies array', async () => {
  const movies = [{ title: 'Test' }];
  stubs.stub(moviesService, 'listMovies', async () => movies);
  const res = createRes();
  await moviesController.listMovies({}, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.movies, movies);
});

test('getMovie returns movie detail', async () => {
  const movie = { title: 'Test' };
  stubs.stub(moviesService, 'getMovieById', async () => movie);
  const req = { params: { id: 'm1' }, user: { username: 'demo' } };
  const res = createRes();
  await moviesController.getMovie(req, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data.movie, movie);
});

test('seedHealth responds with seeded true when count > 0', async () => {
  stubs.stub(moviesService, 'countMovies', async () => 5);
  const res = createRes();
  await moviesController.seedHealth({}, res);
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(res.body.data, { seeded: true });
  assert.strictEqual(res.body.meta.count, 5);
});
