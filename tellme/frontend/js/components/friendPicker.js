import { state } from '../state.js';
import { api } from '../api.js';

export const friendPicker = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'picker';

  const label = document.createElement('label');
  label.textContent = 'Select friends';
  label.className = 'picker-label';

  const list = document.createElement('div');
  list.className = 'picker-list';

  const status = document.createElement('div');
  status.className = 'picker-status';
  status.textContent = 'Loading friends...';
  list.appendChild(status);

  api.listFriends(state.auth?.username || '').then(({ res, payload }) => {
    list.innerHTML = '';
    if (!res.ok) {
      status.textContent = 'Unable to load friends.';
      list.appendChild(status);
      return;
    }
    const friends = payload.data?.friends || [];
    if (!friends.length) {
      status.textContent = 'No friends yet.';
      list.appendChild(status);
      return;
    }
    friends.forEach((friend) => {
      const item = document.createElement('label');
      item.className = 'picker-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = friend.username;
      checkbox.checked = state.pickForMeSelections.friends.includes(friend.username);

      const text = document.createElement('span');
      text.textContent = friend.username;

      checkbox.addEventListener('change', () => {
        const set = new Set(state.pickForMeSelections.friends);
        if (checkbox.checked) set.add(friend.username);
        else set.delete(friend.username);
        state.pickForMeSelections.friends = Array.from(set);
      });

      item.appendChild(checkbox);
      item.appendChild(text);
      list.appendChild(item);
    });
  });

  wrapper.appendChild(label);
  wrapper.appendChild(list);
  return wrapper;
};
