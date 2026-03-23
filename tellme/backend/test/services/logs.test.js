const test = require('node:test');
const assert = require('node:assert/strict');

const logModel = require('../../src/models/log');
const userModel = require('../../src/models/user');
const movieModel = require('../../src/models/movie');
const friendModel = require('../../src/models/friend');
const logsService = require('../../src/services/logs');

const makeId = (value) => ({
  toString() {
    return value;
  }
});

test('listLogs returns all logs, including multiple entries for the same movie', async () => {
  userModel.findByUsernameInsensitive = async () => ({ _id: makeId('u1') });
  friendModel.findFriend = async () => ({ _id: makeId('f1') });
  logModel.listLogs = async () => ([
    { _id: makeId('l1'), movieId: makeId('m1'), rating: 4, createdAt: new Date('2024-01-01') },
    { _id: makeId('l2'), movieId: makeId('m1'), rating: 5, createdAt: new Date('2024-01-02') }
  ]);
  movieModel.findByIds = async () => ([
    { _id: makeId('m1'), title: 'Same Movie', posterUrl: '' }
  ]);

  const logs = await logsService.listLogs({ username: 'alice', viewerUsername: 'alice' });

  assert.equal(logs.length, 2);
  assert.equal(logs[0].title, 'Same Movie');
  assert.equal(logs[1].title, 'Same Movie');
});
