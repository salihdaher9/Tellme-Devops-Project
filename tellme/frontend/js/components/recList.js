export const recList = ({ primary, secondary }, { onLogPick } = {}) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'rec-list';

  if (!primary) {
    wrapper.textContent = 'No recommendations yet.';
    return wrapper;
  }

  const primaryCard = document.createElement('div');
  primaryCard.className = 'rec-card primary';

  const primaryPoster = document.createElement('img');
  primaryPoster.className = 'rec-poster';
  primaryPoster.alt = `${primary.title} poster`;
  primaryPoster.src = primary.posterUrl || '/assets/placeholder-poster.svg';

  const primaryTitle = document.createElement('div');
  primaryTitle.className = 'rec-title';
  primaryTitle.textContent = `${primary.title} (${primary.year})`;

  primaryCard.appendChild(primaryPoster);
  primaryCard.appendChild(primaryTitle);
  const primaryProof = document.createElement('div');
  primaryProof.className = 'rec-proof';
  primaryProof.textContent = 'Picked from your friends’ ratings';
  primaryCard.appendChild(primaryProof);

  if (primary.id && onLogPick) {
    const logBtn = document.createElement('button');
    logBtn.type = 'button';
    logBtn.className = 'rec-log';
    logBtn.textContent = 'Log this pick';
    logBtn.addEventListener('click', () => onLogPick(primary.id));
    primaryCard.appendChild(logBtn);
  }

  const secondaryWrap = document.createElement('div');
  secondaryWrap.className = 'rec-secondary';

  secondary.forEach((rec) => {
    const card = document.createElement('div');
    card.className = 'rec-card secondary';

    const poster = document.createElement('img');
    poster.className = 'rec-poster';
    poster.alt = `${rec.title} poster`;
    poster.src = rec.posterUrl || '/assets/placeholder-poster.svg';

    const title = document.createElement('div');
    title.className = 'rec-title';
    title.textContent = `${rec.title} (${rec.year})`;

    card.appendChild(poster);
    card.appendChild(title);
    const proof = document.createElement('div');
    proof.className = 'rec-proof';
    proof.textContent = 'Picked from your friends’ ratings';
    card.appendChild(proof);
    if (rec.id && onLogPick) {
      const logBtn = document.createElement('button');
      logBtn.type = 'button';
      logBtn.className = 'rec-log';
      logBtn.textContent = 'Log this pick';
      logBtn.addEventListener('click', () => onLogPick(rec.id));
      card.appendChild(logBtn);
    }
    secondaryWrap.appendChild(card);
  });

  wrapper.appendChild(primaryCard);
  wrapper.appendChild(secondaryWrap);
  return wrapper;
};
