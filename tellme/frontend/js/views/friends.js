import { state } from '../state.js';
import { api } from '../api.js';
import { profileModal } from '../components/profileModal.js';

export const renderFollowing = () => {
  const section = document.createElement('section');
  section.className = 'friends';

  const heading = document.createElement('h2');
  heading.textContent = 'Following';
  section.appendChild(heading);

  const summary = document.createElement('div');
  summary.className = 'friends-summary';
  summary.textContent = 'Following: 0';
  section.appendChild(summary);

  const form = document.createElement('form');
  form.className = 'friends-search';

  const label = document.createElement('label');
  label.textContent = 'Find a friend by username';
  label.htmlFor = 'friend-search';

  const input = document.createElement('input');
  input.id = 'friend-search';
  input.name = 'friend-search';
  input.placeholder = 'e.g., maya';

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Search';

  const error = document.createElement('div');
  error.className = 'friends-error is-hidden';

  const result = document.createElement('div');
  result.className = 'friends-result';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'friends-add is-hidden';
  addButton.textContent = 'Add friend';

  form.appendChild(label);
  form.appendChild(input);
  form.appendChild(button);
  form.appendChild(error);
  form.appendChild(result);
  form.appendChild(addButton);
  section.appendChild(form);

  let lastLookup = null;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    error.classList.add('is-hidden');
    result.textContent = '';

    const username = input.value.trim();
    if (!username) {
      error.textContent = 'Username is required.';
      error.classList.remove('is-hidden');
      return;
    }

    const { res, payload } = await api.lookupUser(username);
    if (!res.ok) {
      error.textContent = payload?.error?.message || 'Lookup failed.';
      error.classList.remove('is-hidden');
      addButton.classList.add('is-hidden');
      return;
    }

    if (payload.meta?.exists) {
      result.textContent = `User found: ${payload.data.user.username}`;
      lastLookup = payload.data.user.username;
      addButton.classList.remove('is-hidden');
    } else {
      result.textContent = 'No user found.';
      lastLookup = null;
      addButton.classList.add('is-hidden');
    }
  });

  const profile = profileModal();
  section.appendChild(profile.element);

  const refreshFriends = async () => {
    const { res, payload } = await api.listFriends(state.auth?.username || '');
    if (!res.ok) return;
    const friends = payload?.data?.friends || [];
    summary.textContent = `Following: ${friends.length}`;
    list.innerHTML = '';
    if (!friends.length) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'friends-item';
      emptyItem.textContent = 'No friends yet.';
      list.appendChild(emptyItem);
      return;
    }
    friends.forEach((friend) => {
      const item = document.createElement('li');
      item.className = 'friends-item';

      const avatar = document.createElement('img');
      avatar.className = 'friends-avatar';
      avatar.alt = `${friend.username} avatar`;
      avatar.src = friend.avatarUrl || '/assets/placeholder-avatar.svg';

      const meta = document.createElement('div');
      meta.className = 'friends-meta';

      const name = document.createElement('button');
      name.type = 'button';
      name.className = 'friends-name';
      name.textContent = friend.username;
      name.addEventListener('click', () => {
        profile.open({
          username: friend.username,
          friendRecordId: friend.id,
          onRemove: refreshFriends
        });
      });

      meta.appendChild(name);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'friends-remove';
      remove.textContent = 'Remove';
      remove.addEventListener('click', async () => {
        const { res } = await api.removeFriend(friend.id);
        if (!res.ok) {
          error.textContent = 'Remove failed.';
          error.classList.remove('is-hidden');
          return;
        }
        await refreshFriends();
      });

      item.appendChild(avatar);
      item.appendChild(meta);
      item.appendChild(remove);
      list.appendChild(item);
    });
  };

  addButton.addEventListener('click', async () => {
    error.textContent = '';
    error.classList.add('is-hidden');
    if (!lastLookup) return;

    const username = state.auth?.username;
    if (!username) {
      error.textContent = 'Please sign in again.';
      error.classList.remove('is-hidden');
      return;
    }

    const { res, payload } = await api.addFriend({ friendUsername: lastLookup });
    if (!res.ok) {
      const code = payload?.error?.code;
      if (code === 'CANNOT_ADD_SELF') {
        error.textContent = 'You cannot add yourself.';
      } else if (code === 'FRIEND_ALREADY_ADDED') {
        error.textContent = 'Friend already added.';
      } else if (code === 'USER_NOT_FOUND') {
        error.textContent = 'User not found.';
      } else {
        error.textContent = payload?.error?.message || 'Add friend failed.';
      }
      error.classList.remove('is-hidden');
      return;
    }

    result.textContent = `Added friend: ${payload.data.friend.username}`;
    addButton.classList.add('is-hidden');
    await refreshFriends();
  });

  const list = document.createElement('ul');
  list.className = 'friends-list';

  const subheading = document.createElement('h3');
  subheading.textContent = 'Your friends';
  section.appendChild(subheading);
  section.appendChild(list);

  refreshFriends();

  return section;
};
