import { state } from '../state.js';
import { api } from '../api.js';

export const renderFollowers = () => {
  const section = document.createElement('section');
  section.className = 'followers';

  const heading = document.createElement('h2');
  heading.textContent = 'Followers';
  section.appendChild(heading);

  const summary = document.createElement('div');
  summary.className = 'friends-summary';
  summary.textContent = 'Followers: 0';
  section.appendChild(summary);

  const list = document.createElement('ul');
  list.className = 'friends-list';

  const status = document.createElement('div');
  status.className = 'friends-status';
  status.textContent = 'Loading followers...';
  section.appendChild(status);
  section.appendChild(list);

  const followingUsernames = new Set();
  let followersCache = [];

  const renderList = () => {
    list.innerHTML = '';
    if (!followersCache.length) {
      status.textContent = 'No followers yet.';
      return;
    }
    summary.textContent = `Followers: ${followersCache.length}`;
    status.textContent = '';
    followersCache.forEach((follower) => {
      const item = document.createElement('li');
      item.className = 'friends-item';

      const avatar = document.createElement('img');
      avatar.className = 'friends-avatar';
      avatar.alt = `${follower.username} avatar`;
      avatar.src = follower.avatarUrl || '/assets/placeholder-avatar.svg';

      const meta = document.createElement('div');
      meta.className = 'friends-meta';

      const name = document.createElement('div');
      name.className = 'friends-name';
      name.textContent = follower.username;

      const email = document.createElement('div');
      email.className = 'friends-email';
      email.textContent = follower.email || '';

      meta.appendChild(name);
      if (follower.email) meta.appendChild(email);
      item.appendChild(avatar);
      item.appendChild(meta);

      const actions = document.createElement('div');
      actions.className = 'friends-actions';
      const followsAlready = followingUsernames.has(follower.username);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'friends-follow';
      button.textContent = followsAlready ? 'Following' : 'Follow';
      button.disabled = followsAlready;
      button.addEventListener('click', async () => {
        button.textContent = 'Following';
        button.disabled = true;
        const { res } = await api.addFriend({ friendUsername: follower.username });
        if (!res.ok) {
          button.textContent = 'Follow';
          button.disabled = false;
          return;
        }
        followingUsernames.add(follower.username);
      });
      actions.appendChild(button);
      item.appendChild(actions);
      list.appendChild(item);
    });
  };

  const loadFollowers = () => {
    api.listFollowers(state.auth?.username || '').then(({ res, payload }) => {
      if (!res.ok) {
        status.textContent = 'Unable to load followers.';
        return;
      }
      followersCache = payload.data?.followers || [];
      renderList();
    });
  };

  const loadFollowing = () => {
    api.listFriends(state.auth?.username || '').then(({ res, payload }) => {
      if (!res.ok) {
        loadFollowers();
        return;
      }
      followingUsernames.clear();
      (payload.data?.friends || []).forEach((f) => followingUsernames.add(f.username));
      loadFollowers();
    });
  };

  loadFollowing();

  return section;
};
