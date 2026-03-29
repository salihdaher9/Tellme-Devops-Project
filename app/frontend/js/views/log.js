import { state } from '../state.js';
import { api } from '../api.js';

export const renderLogs = () => {
  const section = document.createElement('section');
  section.className = 'logs';

  const heading = document.createElement('h2');
  heading.textContent = 'My Logs';
  section.appendChild(heading);

  const summary = document.createElement('div');
  summary.className = 'logs-summary';
  summary.textContent = 'Unique movies: 0';
  section.appendChild(summary);

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'logs-search';
  search.placeholder = 'Search logs...';
  section.appendChild(search);

  const list = document.createElement('ul');
  list.className = 'logs-list';

  const status = document.createElement('div');
  status.className = 'logs-status';
  status.textContent = 'Loading logs...';
  section.appendChild(status);

  let logsCache = [];

  const renderLogs = (items) => {
    list.innerHTML = '';
    if (!items.length) {
      status.textContent = 'No logs yet.';
      return;
    }
    status.textContent = '';
    items.forEach((log) => {
      const item = document.createElement('li');
      item.className = 'logs-item';
      const poster = document.createElement('img');
      poster.className = 'logs-poster';
      poster.alt = `${log.title} poster`;
      poster.src = log.posterUrl || '/assets/placeholder-poster.svg';

      const meta = document.createElement('div');
      meta.className = 'logs-meta';

      const title = document.createElement('div');
      title.className = 'logs-title';
      title.textContent = log.title;

      const date = new Date(log.date).toISOString().slice(0, 10);
      const detail = document.createElement('div');
      detail.className = 'logs-detail';
      detail.textContent = `Rating: ${log.rating} · ${date}`;

      meta.appendChild(title);
      meta.appendChild(detail);

      const content = document.createElement('div');
      content.className = 'logs-content';
      content.appendChild(meta);
      if (log.review) {
        const review = document.createElement('div');
        review.className = 'logs-review';
        review.textContent = log.review;
        const needsToggle = log.review.length > 150;
        if (needsToggle) review.classList.add('truncated');
        content.appendChild(review);
        if (needsToggle) {
          const actions = document.createElement('div');
          actions.className = 'logs-review-actions';
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'logs-review-toggle';
          toggle.textContent = 'Read more';
          toggle.addEventListener('click', () => {
            review.classList.toggle('truncated');
            toggle.textContent = review.classList.contains('truncated') ? 'Read more' : 'Show less';
          });
          actions.appendChild(toggle);
          content.appendChild(actions);
        }
      }

      item.appendChild(poster);
      item.appendChild(content);

      list.appendChild(item);
    });
  };

  const applyFilter = () => {
    const query = search.value.trim().toLowerCase();
    if (!query) {
      renderLogs(logsCache);
      return;
    }
    const filtered = logsCache.filter((log) => log.title.toLowerCase().includes(query));
    renderLogs(filtered);
  };

  const loadLogs = async () => {
    const { res, payload } = await api.listLogs();
    if (!res.ok) {
      status.textContent = 'Unable to load logs.';
      return;
    }
    logsCache = (payload.data?.logs || [])
      .slice()
      .sort((a, b) => b.rating - a.rating);
    const uniqueMovies = new Set(logsCache.map((log) => log.movieId?.toString?.() || log.movieId));
    summary.textContent = `Unique movies: ${uniqueMovies.size}`;
    applyFilter();
  };

  window.addEventListener('logs:update', loadLogs);

  loadLogs();

  search.addEventListener('input', applyFilter);

  section.appendChild(list);
  return section;
};
