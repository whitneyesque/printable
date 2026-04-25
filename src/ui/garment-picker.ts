import { GARMENTS } from '../data/garments/index';
import { getCurrentGarment, setCurrentGarment, onGarmentChange } from '../state/design';

export function renderGarmentPicker(container: HTMLElement): void {
  const list = document.createElement('div');
  list.className = 'garment-picker';

  function updateActive(): void {
    const current = getCurrentGarment();
    list.querySelectorAll<HTMLButtonElement>('.garment-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset['id'] === current.id);
    });
  }

  GARMENTS.forEach((garment) => {
    const btn = document.createElement('button');
    btn.className = 'garment-btn';
    btn.dataset['id'] = garment.id;

    const thumb = document.createElement('img');
    thumb.src = import.meta.env.BASE_URL + garment.image;
    thumb.alt = garment.label;

    const label = document.createElement('span');
    label.textContent = garment.label;

    btn.appendChild(thumb);
    btn.appendChild(label);
    btn.addEventListener('click', () => setCurrentGarment(garment.id));
    list.appendChild(btn);
  });

  onGarmentChange(updateActive);
  container.appendChild(list);
  updateActive();
}
