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

function loadLocalFont(fontId: string): void {
  const font = FONTS.find((f) => f.id === fontId);
  if (!font || font.source !== 'local' || !font.file) return;
  const styleId = `local-font-${fontId}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `@font-face { font-family: '${font.family}'; src: url('${import.meta.env.BASE_URL}${font.file}'); font-display: swap; }`;
  document.head.appendChild(style);
}

export function renderFontPicker(container: HTMLElement): void {
  // Load all fonts upfront so preview buttons render in their own face
  FONTS.forEach((f) => {
    if (f.source === 'google') loadGoogleFont(f.id);
    else loadLocalFont(f.id);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'font-picker';

  const heading = document.createElement('h3');
  heading.textContent = 'Font';
  wrapper.appendChild(heading);

  // Dropdown trigger
  const dropdown = document.createElement('div');
  dropdown.className = 'font-dropdown';

  const trigger = document.createElement('button');
  trigger.className = 'font-trigger';
  dropdown.appendChild(trigger);

  // Scrollable options list
  const menu = document.createElement('div');
  menu.className = 'font-menu';
  menu.hidden = true;
  dropdown.appendChild(menu);

  FONTS.forEach((font) => {
    const opt = document.createElement('button');
    opt.className = 'font-option';
    opt.dataset['fontId'] = font.id;
    opt.textContent = font.displayName;
    opt.style.fontFamily = `'${font.family}', sans-serif`;
    opt.addEventListener('click', () => {
      const current = getTextLayer();
      const patch: Parameters<typeof updateTextLayer>[0] = { fontId: font.id };
      if (current.bold && !font.hasBold) patch.bold = false;
      if (current.italic && !font.hasItalic) patch.italic = false;
      updateTextLayer(patch);
      menu.hidden = true;
    });
    menu.appendChild(opt);
  });

  // Toggle open / close — use fixed positioning to escape sidebar overflow clipping
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    if (isOpen) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${rect.left}px`;
    menu.style.width = `${rect.width}px`;
    // Cap height to available space below trigger so menu never goes off screen
    menu.style.maxHeight = `${Math.max(120, spaceBelow)}px`;

    const active = menu.querySelector<HTMLElement>('.font-option.active');
    active?.scrollIntoView({ block: 'nearest' });
  });

  // Close on outside click or sidebar scroll (menu is fixed-position so can't follow scroll)
  document.addEventListener('click', () => { menu.hidden = true; });
  document.getElementById('controls')?.addEventListener('scroll', () => { menu.hidden = true; }, { passive: true });

  function updateActive(): void {
    const current = getTextLayer();
    const font = FONTS.find((f) => f.id === current.fontId) ?? FONTS[0];

    trigger.textContent = font.displayName;
    trigger.style.fontFamily = `'${font.family}', sans-serif`;

    menu.querySelectorAll<HTMLButtonElement>('.font-option').forEach((opt) => {
      opt.classList.toggle('active', opt.dataset['fontId'] === current.fontId);
    });
  }

  onLayerChange(updateActive);
  wrapper.appendChild(dropdown);
  container.appendChild(wrapper);
  updateActive();
}
