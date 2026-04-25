import { PALETTE } from '../data/palette/index';
import { getTextLayer, updateTextLayer, onLayerChange } from '../state/design';
import type { PaletteColor } from '../data/palette/types';

function swatchBackground(color: PaletteColor): string {
  if (color.kind === 'solid') return color.hex;
  if (color.kind === 'linear-gradient') {
    const stops = color.stops.map((s) => `${s.hex} ${s.offset * 100}%`).join(', ');
    return `linear-gradient(${color.angle}deg, ${stops})`;
  }
  if (color.kind === 'radial-gradient') {
    const stops = color.stops.map((s) => `${s.hex} ${s.offset * 100}%`).join(', ');
    return `radial-gradient(circle, ${stops})`;
  }
  return '#ffffff';
}

function colorId(color: PaletteColor): string {
  return 'name' in color ? color.name : '';
}

export function renderColorPicker(container: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'color-picker';

  const heading = document.createElement('h3');
  heading.textContent = 'Color';
  wrapper.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'color-grid';

  PALETTE.forEach((color) => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch';
    btn.dataset['id'] = colorId(color);
    btn.title = colorId(color);
    btn.style.background = swatchBackground(color);

    if (color.kind === 'solid' && color.hex === '#FFFFFF') {
      btn.style.boxShadow = 'inset 0 0 0 1px #555';
    }

    btn.addEventListener('click', () => updateTextLayer({ color }));
    grid.appendChild(btn);
  });

  function updateActive(): void {
    const id = colorId(getTextLayer().color);
    grid.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset['id'] === id);
    });
  }

  onLayerChange(updateActive);
  wrapper.appendChild(grid);
  container.appendChild(wrapper);
  updateActive();
}
