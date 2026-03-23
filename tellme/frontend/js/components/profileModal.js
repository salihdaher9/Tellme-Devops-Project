import { api } from '../api.js';

export const profileModal = () => {
  const modal = document.createElement('div');
  modal.className = 'modal is-hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const panel = document.createElement('div');
  panel.className = 'modal-panel profile-panel';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'modal-close';
  close.textContent = 'Close';

  const body = document.createElement('div');
  body.className = 'profile-body';

  panel.appendChild(body);
  panel.appendChild(close);
  modal.appendChild(overlay);
  modal.appendChild(panel);

  const open = async ({ username, friendRecordId, onRemove }) => {
    modal.classList.remove('is-hidden');
    body.innerHTML = '<p class="profile-status">Loading profile...</p>';

    const [{ res: profileRes, payload: profilePayload }, { res: logsRes, payload: logsPayload }]
      = await Promise.all([
        api.getUserProfile(username),
        api.listLogsByUsername(username)
      ]);

    if (!profileRes.ok || !logsRes.ok) {
      body.innerHTML = '<p class="profile-status">Unable to load profile.</p>';
      return;
    }

    const profile = profilePayload.data.user;
    const logs = (logsPayload.data.logs || [])
      .slice()
      .sort((a, b) => (b.rating - a.rating));

    body.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'profile-header';

    const avatar = document.createElement('img');
    avatar.className = 'profile-avatar';
    avatar.alt = `${profile.username} avatar`;
    avatar.src = profile.avatarUrl || '/assets/placeholder-avatar.svg';

    const meta = document.createElement('div');
    meta.className = 'profile-meta';

    const name = document.createElement('h3');
    name.textContent = profile.username;

    const stats = document.createElement('div');
    stats.className = 'profile-stats';
    stats.textContent = `Logs: ${profile.stats.totalLogs} · Avg rating: ${profile.stats.averageRating}`;

    meta.appendChild(name);
    meta.appendChild(stats);
    header.appendChild(avatar);
    header.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'profile-actions';
    if (friendRecordId) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'friends-remove';
      remove.textContent = 'Remove friend';
      remove.addEventListener('click', async () => {
        const { res } = await api.removeFriend(friendRecordId);
        if (res.ok && typeof onRemove === 'function') {
          onRemove();
        }
        modal.classList.add('is-hidden');
      });
      actions.appendChild(remove);
    }

    const list = document.createElement('ul');
    list.className = 'profile-logs';
    if (!logs.length) {
      const empty = document.createElement('li');
      empty.className = 'profile-log-item';
      empty.textContent = 'No logs yet.';
      list.appendChild(empty);
    } else {
      logs.forEach((log, idx) => {
        const item = document.createElement('li');
        item.className = 'profile-log-item';
        const rank = idx + 1;
        const poster = document.createElement('img');
        poster.className = 'profile-log-poster';
        poster.alt = `${log.title} poster`;
        poster.src = log.posterUrl || '/assets/placeholder-poster.svg';

        const meta = document.createElement('div');
        meta.className = 'profile-log-meta';

        const title = document.createElement('div');
        title.className = 'profile-log-title';
        title.textContent = `#${rank} ${log.title}`;

        const detail = document.createElement('div');
        detail.className = 'profile-log-detail';
        detail.textContent = `Rating: ${log.rating}`;

        meta.appendChild(title);
        meta.appendChild(detail);
        item.appendChild(poster);
        item.appendChild(meta);
        list.appendChild(item);
      });
    }

    body.appendChild(header);
    body.appendChild(actions);
    body.appendChild(list);
  };

  const closeModal = () => {
    modal.classList.add('is-hidden');
  };

  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  return { element: modal, open };
};
