import { api } from '../api.js';

export const quickLogSheet = ({ onLogSuccess } = {}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'quick-log is-hidden';

  const overlay = document.createElement('div');
  overlay.className = 'quick-log-overlay';

  const panel = document.createElement('div');
  panel.className = 'quick-log-panel';

  const title = document.createElement('h3');
  title.textContent = 'Quick log';

  const ratingLabel = document.createElement('label');
  ratingLabel.textContent = 'Rating (0-5)';
  ratingLabel.className = 'quick-log-label';

  const ratingInput = document.createElement('input');
  ratingInput.type = 'number';
  ratingInput.min = '0';
  ratingInput.max = '5';
  ratingInput.step = '0.5';
  ratingInput.value = '4';
  ratingInput.className = 'quick-log-rating';

  const reviewLabel = document.createElement('label');
  reviewLabel.textContent = 'Review';
  reviewLabel.className = 'quick-log-label';

  const reviewInput = document.createElement('textarea');
  reviewInput.className = 'quick-log-review';
  reviewInput.rows = 3;
  reviewInput.maxLength = 500;
  reviewInput.placeholder = 'Optional review (500 characters max)';

  const message = document.createElement('div');
  message.className = 'quick-log-message';

  const actions = document.createElement('div');
  actions.className = 'quick-log-actions';

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'quick-log-cancel';
  cancel.textContent = 'Cancel';

  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'quick-log-confirm';
  confirm.textContent = 'Log';

  actions.appendChild(cancel);
  actions.appendChild(confirm);

  panel.appendChild(title);
  panel.appendChild(ratingLabel);
  panel.appendChild(ratingInput);
  panel.appendChild(reviewLabel);
  panel.appendChild(reviewInput);
  panel.appendChild(message);
  panel.appendChild(actions);

  wrapper.appendChild(overlay);
  wrapper.appendChild(panel);

  let currentMovieId = null;

  const open = (movieId) => {
    currentMovieId = movieId;
    ratingInput.value = '4';
    reviewInput.value = '';
    message.textContent = '';
    wrapper.classList.remove('is-hidden');
  };

  const close = () => {
    wrapper.classList.add('is-hidden');
    message.textContent = '';
    currentMovieId = null;
  };

  overlay.addEventListener('click', close);
  cancel.addEventListener('click', close);

  confirm.addEventListener('click', async () => {
    if (!currentMovieId) return;
    const review = reviewInput.value;
    const { res, payload } = await api.createLog({
      movieId: currentMovieId,
      rating: ratingInput.value,
      review
    });
    if (!res.ok) {
      message.textContent = payload?.error?.message || 'Log failed.';
      return;
    }
    close();
    if (typeof onLogSuccess === 'function') {
      onLogSuccess();
    }
    window.dispatchEvent(new Event('logs:update'));
  });

  return { element: wrapper, open, close };
};
