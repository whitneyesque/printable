import { FONTS } from '../data/fonts/index';
import { getTextLayer, updateTextLayer, onLayerChange } from '../state/design';

function loadGoogleFont(fontId: string): void {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font || font.source !== 'google') return;
  if (document.querySelector(`link[data-font="${fontId}"]`)) return;
  const weights = ['400', ...(font.hasBold ? ['700'] : [])].join(';');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.dataset['font'] = fontId;
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${weights}&display=swap`;
  document.head.appendChild(link);
}

export function renderFontPicker(container: HTMLElement): void {
  // Load all fonts upfront for previews (lazy loading is M6)
  FONTS.forEach((f) => loadGoogleFont(f.id));

  const wrapper = document.createElement('div');
  wrapper.className = 'font-picker';

  const heading = document.createElement('h3');
  heading.textContent = 'Font';
  wrapper.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'font-grid';

  FONTS.forEach((font) => {
    const btn = document.createElement('button');
    btn.className = 'font-btn';
    btn.dataset['fontId'] = font.id;
    btn.textContent = font.displayName;
    btn.style.fontFamily = `'${font.family}', sans-serif`;
    btn.addEventListener('click', () => {
      const current = getTextLayer();
      const patch: Parameters<typeof updateTextLayer>[0] = { fontId: font.id };
      if (current.bold && !font.hasBold) patch.bold = false;
      if (current.italic && !font.hasItalic) patch.italic = false;
      updateTextLayer(patch);
    });
    grid.appendChild(btn);
  });

  function updateActive(): void {
    const current = getTextLayer();
    grid.querySelectorAll<HTMLButtonElement>('.font-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset['fontId'] === current.fontId);
    });
  }

  onLayerChange(updateActive);
  wrapper.appendChild(grid);
  container.appendChild(wrapper);
  updateActive();
}
