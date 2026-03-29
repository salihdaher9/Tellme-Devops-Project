import { state } from './state.js';
import { BASE_URL } from './config.js';

const authHeaders = () => {
  if (!state.token) return {};
  return { Authorization: `Bearer ${state.token}` };
};

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/api/health`, {
      headers: { ...authHeaders() }
    });
    return res.json();
  },
  async getFeed() {
    const res = await fetch(`${BASE_URL}/api/feed`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async lookupUser(username) {
    const res = await fetch(`${BASE_URL}/api/users?username=${encodeURIComponent(username)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async addFriend({ friendUsername }) {
    const res = await fetch(`${BASE_URL}/api/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ friendUsername })
    });
    const payload = await res.json();
    return { res, payload };
  },
  async listFriends(username) {
    const res = await fetch(`${BASE_URL}/api/friends?username=${encodeURIComponent(username)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async listFollowers(username) {
    const res = await fetch(`${BASE_URL}/api/followers?username=${encodeURIComponent(username)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async listMovies() {
    const res = await fetch(`${BASE_URL}/api/movies`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async getMovie(id) {
    const res = await fetch(`${BASE_URL}/api/movies/${encodeURIComponent(id)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async createLog({ movieId, rating, review }) {
    const res = await fetch(`${BASE_URL}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ movieId, rating, review })
    });
    const payload = await res.json();
    return { res, payload };
  },
  async listLogs() {
    const res = await fetch(`${BASE_URL}/api/logs`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async listLogsByUsername(username) {
    const res = await fetch(`${BASE_URL}/api/logs?username=${encodeURIComponent(username)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async removeFriend(friendRecordId) {
    const res = await fetch(`${BASE_URL}/api/friends/${encodeURIComponent(friendRecordId)}`, {
      method: 'DELETE',
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async getUserProfile(username) {
    const res = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(username)}`, {
      headers: { ...authHeaders() }
    });
    const payload = await res.json();
    return { res, payload };
  },
  async getRecommendations({ friendUsernames, genre }) {
    const res = await fetch(`${BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ friendUsernames, genre })
    });
    const payload = await res.json();
    return { res, payload };
  }
};
