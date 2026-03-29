import { state } from '../state.js';

const genres = ['Any', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller'];

export const genrePicker = () => {
  const wrapper = document.createElement('div');
  wrapper.className = 'picker';

  const label = document.createElement('label');
  label.textContent = 'Optional genre';
  label.className = 'picker-label';

  const select = document.createElement('select');
  select.className = 'picker-select';

  genres.forEach((genre) => {
    const option = document.createElement('option');
    option.value = genre === 'Any' ? '' : genre;
    option.textContent = genre;
    if (option.value === state.pickForMeSelections.genre) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    state.pickForMeSelections.genre = select.value;
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  return wrapper;
};
