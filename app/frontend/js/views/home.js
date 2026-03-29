import { state } from '../state.js';
import { api } from '../api.js';
import { friendPicker } from '../components/friendPicker.js';
import { genrePicker } from '../components/genrePicker.js';
import { quickLogSheet } from '../components/quickLogSheet.js';
import { recList } from '../components/recList.js';

const renderStars = (rating = 0) => {
  const stars = [];
  for (let i = 1; i <= 5; i += 1) {
    if (rating >= i) {
      stars.push('★');
    } else if (rating >= i - 0.5) {
      stars.push('⋆');
    } else {
      stars.push('☆');
    }
  }
  return stars.join('');
};

export const renderHome = () => {
  const home = document.createElement('div');
  home.className = 'home-page';

  const heroRow = document.createElement('div');
  heroRow.className = 'home-hero';

  const feedSection = document.createElement('section');
  feedSection.className = 'feed';

  const heading = document.createElement('h2');
  heading.textContent = 'Friends feed';
  feedSection.appendChild(heading);

  const feedNav = document.createElement('div');
  feedNav.className = 'carousel-nav';

  const feedPrev = document.createElement('button');
  feedPrev.type = 'button';
  feedPrev.className = 'carousel-btn';
  feedPrev.textContent = '◀';

  const feedNext = document.createElement('button');
  feedNext.type = 'button';
  feedNext.className = 'carousel-btn';
  feedNext.textContent = '▶';

  feedNav.appendChild(feedPrev);
  feedNav.appendChild(feedNext);
  feedSection.appendChild(feedNav);

  const list = document.createElement('ul');
  list.className = 'feed-list';
  feedSection.appendChild(list);

  const reviewsSection = document.createElement('section');
  reviewsSection.className = 'recent-reviews';

  const reviewsHeading = document.createElement('h3');
  reviewsHeading.textContent = 'Latest reviews';
  reviewsSection.appendChild(reviewsHeading);

  const reviewsStatus = document.createElement('div');
  reviewsStatus.className = 'recent-reviews-status';
  reviewsSection.appendChild(reviewsStatus);

  const reviewsList = document.createElement('div');
  reviewsList.className = 'recent-reviews-list';
  reviewsSection.appendChild(reviewsList);

  heroRow.appendChild(feedSection);
  heroRow.appendChild(reviewsSection);
  home.appendChild(heroRow);

  let feedItems = [];
  let feedIndex = 0;

  const renderPlaceholder = () => {
    const placeholders = [
      { text: 'No activity yet — add a friend to get started.' },
      { text: 'Your friends’ latest logs will appear here.' },
      { text: 'Pick for Me will suggest movies once you select friends.' }
    ];
    placeholders.forEach((itemData) => {
      const item = document.createElement('li');
      item.className = 'feed-item';
      const content = document.createElement('span');
      content.textContent = itemData.text;
      item.appendChild(content);
      list.appendChild(item);
    });
  };

  const renderFeedSlice = () => {
    list.innerHTML = '';
    if (!feedItems.length) {
      renderPlaceholder();
      return;
    }
    const slice = feedItems.slice(feedIndex, feedIndex + 4);
    slice.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'feed-item';
      const poster = document.createElement('img');
      poster.className = 'feed-poster';
      poster.alt = `${entry.title} poster`;
      poster.src = entry.posterUrl || '/assets/placeholder-poster.svg';
      const avatar = document.createElement('img');
      avatar.className = 'feed-avatar';
      avatar.alt = `${entry.username} avatar`;
      avatar.src = entry.avatarUrl || '/assets/placeholder-avatar.svg';
      const content = document.createElement('div');
      content.className = 'feed-content';

      const name = document.createElement('div');
      name.className = 'feed-name';
      name.textContent = `${entry.username || 'unknown'}`;

      const email = document.createElement('div');
      email.className = 'feed-email';
      if (entry.email) {
        email.textContent = entry.email;
      }

      const title = document.createElement('div');
      title.className = 'feed-title';
      title.textContent = `${entry.title}`;

      const ratingWrap = document.createElement('div');
      ratingWrap.className = 'feed-rating';
      ratingWrap.textContent = `${entry.rating} · ${renderStars(entry.rating)}`;

      content.appendChild(name);
      if (entry.email) content.appendChild(email);
      content.appendChild(title);
      content.appendChild(ratingWrap);

      item.appendChild(poster);
      item.appendChild(avatar);
      item.appendChild(content);
      list.appendChild(item);
    });
  };

  const renderReviewCards = () => {
    reviewsList.innerHTML = '';
    const reviewEntries = feedItems.filter((entry) => entry.review && entry.review.trim().length);
    const slice = reviewEntries.slice(0, 4);
    if (!slice.length) {
      reviewsStatus.textContent = 'No written reviews yet.';
      return;
    }
    reviewsStatus.textContent = '';
    slice.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'review-card';

      const title = document.createElement('h4');
      title.textContent = entry.title;
      card.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'review-meta';
      const date = new Date(entry.date).toLocaleDateString();
      meta.textContent = `${entry.username} · ${entry.rating} ${renderStars(entry.rating)} · ${date}`;
      card.appendChild(meta);

      const body = document.createElement('p');
      body.className = 'review-body';
      const needsToggle = entry.review.length > 120;
      if (needsToggle) {
        body.classList.add('truncated');
      }
      body.textContent = entry.review;
      card.appendChild(body);

      if (needsToggle) {
        const actions = document.createElement('div');
        actions.className = 'review-actions';
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.textContent = 'Read more';
        toggle.addEventListener('click', () => {
          body.classList.toggle('truncated');
          const isCollapsed = body.classList.contains('truncated');
          toggle.textContent = isCollapsed ? 'Read more' : 'Show less';
        });
        actions.appendChild(toggle);
        card.appendChild(actions);
      }

      reviewsList.appendChild(card);
    });
  };

  const refreshFeed = async () => {
    const { res: feedRes, payload: feedPayload } = await api.getFeed();
    if (!feedRes.ok) {
      feedItems = [];
      renderFeedSlice();
      renderReviewCards();
      return;
    }
    feedItems = feedPayload.data?.feed || [];
    feedIndex = 0;
    renderFeedSlice();
    renderReviewCards();
  };

  feedPrev.addEventListener('click', () => {
    if (!feedItems.length) return;
    feedIndex = Math.max(0, feedIndex - 4);
    renderFeedSlice();
  });

  feedNext.addEventListener('click', () => {
    if (!feedItems.length) return;
    const maxIndex = Math.max(0, feedItems.length - 4);
    feedIndex = Math.min(maxIndex, feedIndex + 4);
    renderFeedSlice();
  });

  refreshFeed();

  const catalog = document.createElement('section');
  catalog.className = 'catalog';

  const catalogHeading = document.createElement('h2');
  catalogHeading.textContent = 'Catalog';
  catalog.appendChild(catalogHeading);

  const catalogSearch = document.createElement('input');
  catalogSearch.type = 'search';
  catalogSearch.className = 'catalog-search';
  catalogSearch.placeholder = 'Search movies...';
  catalog.appendChild(catalogSearch);

  const catalogNav = document.createElement('div');
  catalogNav.className = 'carousel-nav';

  const catalogPrev = document.createElement('button');
  catalogPrev.type = 'button';
  catalogPrev.className = 'carousel-btn';
  catalogPrev.textContent = '◀';

  const catalogNext = document.createElement('button');
  catalogNext.type = 'button';
  catalogNext.className = 'carousel-btn';
  catalogNext.textContent = '▶';

  catalogNav.appendChild(catalogPrev);
  catalogNav.appendChild(catalogNext);
  catalog.appendChild(catalogNav);

  const catalogStatus = document.createElement('div');
  catalogStatus.className = 'catalog-status';
  catalogStatus.textContent = 'Loading catalog...';
  catalog.appendChild(catalogStatus);

  const catalogList = document.createElement('ul');
  catalogList.className = 'catalog-list';
  catalog.appendChild(catalogList);

  const quickLog = quickLogSheet({ onLogSuccess: refreshFeed });
  catalog.appendChild(quickLog.element);

  let catalogMovies = [];
  let catalogIndex = 0;

  const getFilteredMovies = () => {
    const query = catalogSearch.value.trim().toLowerCase();
    if (!query) return catalogMovies;
    return catalogMovies.filter((movie) => (
      movie.title.toLowerCase().includes(query) ||
      movie.genre.toLowerCase().includes(query)
    ));
  };

  const renderCatalogSlice = () => {
    catalogList.innerHTML = '';
    const filtered = getFilteredMovies();
    if (!filtered.length) {
      catalogStatus.textContent = 'No matches found.';
      return;
    }
    catalogStatus.textContent = '';
    const slice = filtered.slice(catalogIndex, catalogIndex + 3);
    slice.forEach((movie) => {
      const item = document.createElement('li');
      item.className = 'catalog-item';
      item.dataset.id = movie._id || '';

      const poster = document.createElement('img');
      poster.className = 'catalog-poster';
      poster.alt = `${movie.title} poster`;
      poster.src = movie.posterUrl || '/assets/placeholder-poster.svg';

      const title = document.createElement('span');
      title.className = 'catalog-title';
      title.textContent = `${movie.title} (${movie.year})`;

      const quickBtn = document.createElement('button');
      quickBtn.type = 'button';
      quickBtn.className = 'catalog-quick';
      quickBtn.textContent = 'Quick log';
      quickBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        quickLog.open(movie._id);
      });

      item.appendChild(poster);
      item.appendChild(title);
      item.appendChild(quickBtn);
      catalogList.appendChild(item);
    });
  };

  catalogPrev.addEventListener('click', () => {
    const filtered = getFilteredMovies();
    if (!filtered.length) return;
    catalogIndex = Math.max(0, catalogIndex - 3);
    renderCatalogSlice();
  });

  catalogNext.addEventListener('click', () => {
    const filtered = getFilteredMovies();
    if (!filtered.length) return;
    const maxIndex = Math.max(0, filtered.length - 3);
    catalogIndex = Math.min(maxIndex, catalogIndex + 3);
    renderCatalogSlice();
  });

  const detail = document.createElement('div');
  detail.className = 'movie-detail is-hidden';

  const detailClose = document.createElement('button');
  detailClose.type = 'button';
  detailClose.className = 'movie-detail-close';
  detailClose.textContent = 'Back to catalog';

  const detailBody = document.createElement('div');
  detailBody.className = 'movie-detail-body';

  detail.appendChild(detailClose);
  detail.appendChild(detailBody);
  catalog.appendChild(detail);

  detailClose.addEventListener('click', () => {
    detail.classList.add('is-hidden');
    catalogStatus.textContent = '';
  });

  catalogList.addEventListener('click', async (event) => {
    const item = event.target.closest('.catalog-item');
    if (!item?.dataset?.id) return;
    const { res, payload } = await api.getMovie(item.dataset.id);
    if (!res.ok) {
      catalogStatus.textContent = 'Unable to load details.';
      detail.classList.add('is-hidden');
      return;
    }
    const movie = payload.data.movie;
    detailBody.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = `${movie.title} (${movie.year})`;
    const genre = document.createElement('p');
    genre.textContent = `Genre: ${movie.genre}`;
    const poster = document.createElement('img');
    poster.className = 'movie-detail-poster';
    poster.alt = `${movie.title} poster`;
    poster.src = movie.posterUrl || '/assets/placeholder-poster.svg';

    const ratingLabel = document.createElement('label');
    ratingLabel.textContent = 'Rating (0-5)';
    ratingLabel.className = 'movie-detail-label';

    const ratingInput = document.createElement('input');
    ratingInput.type = 'number';
    ratingInput.min = '0';
    ratingInput.max = '5';
    ratingInput.step = '0.5';
    ratingInput.value = '4';
    ratingInput.className = 'movie-detail-rating';

    const reviewLabel = document.createElement('label');
    reviewLabel.textContent = 'Review';
    reviewLabel.className = 'movie-detail-label';

    const reviewInput = document.createElement('textarea');
    reviewInput.className = 'movie-detail-review';
    reviewInput.rows = 3;
    reviewInput.maxLength = 500;
    reviewInput.placeholder = 'Write a short review...';

    const logBtn = document.createElement('button');
    logBtn.type = 'button';
    logBtn.className = 'movie-detail-log';
    logBtn.textContent = 'Log this movie';

    const logMsg = document.createElement('div');
    logMsg.className = 'movie-detail-message';

    const stats = document.createElement('div');
    stats.className = 'movie-detail-stats';

    const reviewsWrap = document.createElement('div');
    reviewsWrap.className = 'movie-detail-reviews';

    detailBody.appendChild(title);
    detailBody.appendChild(genre);
    detailBody.appendChild(poster);
    detailBody.appendChild(ratingLabel);
    detailBody.appendChild(ratingInput);
    detailBody.appendChild(reviewLabel);
    detailBody.appendChild(reviewInput);
    detailBody.appendChild(logBtn);
    detailBody.appendChild(logMsg);
    detailBody.appendChild(stats);
    detailBody.appendChild(reviewsWrap);

    const renderReviews = (movieData) => {
      const overall = movieData.stats?.overallAverage ?? 0;
      const overallCount = movieData.stats?.overallCount ?? 0;
      const friendsAvg = movieData.stats?.friendsAverage;
      const friendsCount = movieData.stats?.friendsCount ?? 0;

      stats.innerHTML = '';
      const overallText = document.createElement('div');
      overallText.textContent = `All users avg: ${overall.toFixed(2)} ${renderStars(overall)} (${overallCount} ratings)`;
      stats.appendChild(overallText);

      const friendsText = document.createElement('div');
      friendsText.textContent = friendsAvg == null
        ? 'Friends avg: no friend ratings yet.'
        : `Friends avg: ${friendsAvg.toFixed(2)} ${renderStars(friendsAvg)} (${friendsCount} ratings)`;
      stats.appendChild(friendsText);

      reviewsWrap.innerHTML = '';
      const heading = document.createElement('h4');
      heading.textContent = 'Reviews';
      reviewsWrap.appendChild(heading);

      const reviews = movieData.reviews || [];
      if (!reviews.length) {
        const empty = document.createElement('div');
        empty.className = 'movie-detail-empty';
        empty.textContent = 'No reviews yet.';
        reviewsWrap.appendChild(empty);
        return;
      }
      const list = document.createElement('ul');
      list.className = 'movie-detail-review-list';
      reviews.forEach((review, idx) => {
        const item = document.createElement('li');
        item.className = 'movie-detail-review-item';
        const title = document.createElement('div');
        title.className = 'movie-detail-review-title';
        title.textContent = `#${idx + 1} ${review.username}`;
        const detail = document.createElement('div');
        detail.className = 'movie-detail-review-body';
        detail.textContent = `${review.rating} · ${review.review || 'No review.'}`;
        item.appendChild(title);
        item.appendChild(detail);
        list.appendChild(item);
      });
      reviewsWrap.appendChild(list);
    };

    logBtn.addEventListener('click', async () => {
      logMsg.textContent = '';
      const rating = ratingInput.value;
      const review = reviewInput.value;
      const { res, payload } = await api.createLog({ movieId: movie._id, rating, review });
      if (!res.ok) {
        logMsg.textContent = payload?.error?.message || 'Log failed.';
        return;
      }
      logMsg.textContent = 'Logged!';
      reviewInput.value = '';
      const refreshed = await api.getMovie(movie._id);
      if (refreshed.res.ok) {
        renderReviews(refreshed.payload.data.movie);
        reviewsStatus.textContent = '';
        await refreshFeed();
      }
      window.dispatchEvent(new Event('logs:update'));
    });

    renderReviews(movie);
    detail.classList.remove('is-hidden');
  });

  api.listMovies().then(({ res, payload }) => {
    if (!res.ok) {
      catalogStatus.textContent = 'Unable to load catalog.';
      return;
    }
    catalogMovies = payload.data?.movies || [];
    if (!catalogMovies.length) {
      catalogStatus.textContent = 'No movies available.';
      return;
    }
    catalogStatus.textContent = '';
    catalogIndex = 0;
    renderCatalogSlice();
  });

  catalogSearch.addEventListener('input', () => {
    catalogIndex = 0;
    renderCatalogSlice();
  });

  const cta = document.createElement('button');
  cta.className = 'cta';
  cta.type = 'button';
  cta.textContent = 'Pick for Me';

  const modal = document.createElement('div');
  modal.className = 'modal is-hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const panel = document.createElement('div');
  panel.className = 'modal-panel';

  const title = document.createElement('h3');
  title.textContent = 'Pick for Me';

  const pickerFriends = friendPicker();
  const pickerGenre = genrePicker();

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'modal-submit';
  submit.textContent = 'Get picks';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'modal-close';
  close.textContent = 'Close';

  panel.appendChild(title);
  panel.appendChild(pickerFriends);
  panel.appendChild(pickerGenre);
  panel.appendChild(submit);
  panel.appendChild(close);

  modal.appendChild(overlay);
  modal.appendChild(panel);

  const openModal = () => {
    modal.classList.remove('is-hidden');
    close.focus();
  };

  const closeModal = () => {
    modal.classList.add('is-hidden');
    cta.focus();
  };

  cta.addEventListener('click', openModal);
  const recSection = document.createElement('section');
  recSection.className = 'rec-section';
  recSection.id = 'pick-results';
  const recTitle = document.createElement('h2');
  recTitle.textContent = 'Pick for Me';
  const recStatus = document.createElement('div');
  recStatus.className = 'picks-status';
  const recContainer = document.createElement('div');
  recContainer.className = 'rec-container';
  recSection.appendChild(recTitle);
  recSection.appendChild(recStatus);
  recSection.appendChild(recContainer);

  const renderRecs = async () => {
    if (!state.pickForMeSelections.friends.length) {
      recStatus.textContent = 'Select friends to get recommendations.';
      recContainer.innerHTML = '';
      return;
    }
    recStatus.textContent = 'Loading recommendations...';
    const { res, payload } = await api.getRecommendations({
      friendUsernames: state.pickForMeSelections.friends,
      genre: state.pickForMeSelections.genre || ''
    });
    if (!res.ok || !payload?.data?.primary) {
      recStatus.textContent = 'No recommendations yet.';
      recContainer.innerHTML = '';
      return;
    }
    recStatus.textContent = '';
    recContainer.innerHTML = '';
    recContainer.appendChild(recList(payload.data, {
      onLogPick: quickLog.open
    }));
  };

  submit.addEventListener('click', async () => {
    closeModal();
    await renderRecs();
    recSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  close.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'cta-wrap';
  ctaWrap.appendChild(cta);

  home.appendChild(catalog);
  home.appendChild(ctaWrap);
  home.appendChild(modal);
  home.appendChild(recSection);
  return home;
};
