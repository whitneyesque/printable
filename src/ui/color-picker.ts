import { PALETTE } from '../data/palette/index';
import { CRAYONS } from '../data/palette/crayons';
import { getTextLayer, updateTextLayer, onLayerChange } from '../state/design';
import type { PaletteColor } from '../data/palette/types';
import type { CrayonColor } from '../data/palette/crayons';

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
  // per-letter rainbow preview
  return 'linear-gradient(90deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%))';
}

function colorId(color: PaletteColor): string {
  return color.name;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function renderColorPicker(container: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'color-picker';

  const heading = document.createElement('h3');
  heading.textContent = 'Color';
  wrapper.appendChild(heading);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'color-tab-bar';

  const tabs = ['Palette', 'Crayons', 'Custom'] as const;
  type TabName = (typeof tabs)[number];

  const tabBtns: Record<TabName, HTMLButtonElement> = {} as Record<TabName, HTMLButtonElement>;
  const tabPanels: Record<TabName, HTMLDivElement> = {} as Record<TabName, HTMLDivElement>;

  tabs.forEach((name) => {
    const btn = document.createElement('button');
    btn.className = 'color-tab-btn';
    btn.textContent = name;
    btn.dataset['tab'] = name;
    tabBtns[name] = btn;
    tabBar.appendChild(btn);
  });

  wrapper.appendChild(tabBar);

  function switchTab(name: TabName): void {
    tabs.forEach((t) => {
      tabBtns[t].classList.toggle('active', t === name);
      tabPanels[t].hidden = t !== name;
    });
  }

  // ── Palette tab ───────────────────────────────────────────────────────────
  const palettePanel = document.createElement('div');
  palettePanel.className = 'color-tab-panel';
  tabPanels['Palette'] = palettePanel;

  const paletteGrid = document.createElement('div');
  paletteGrid.className = 'color-grid';

  PALETTE.forEach((color) => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch';
    btn.dataset['id'] = colorId(color);
    btn.title = colorId(color);
    btn.style.background = swatchBackground(color);
    if (color.kind === 'solid' && color.hex.toLowerCase() === '#ffffff') {
      btn.style.boxShadow = 'inset 0 0 0 1px #555';
    }
    btn.addEventListener('click', () => updateTextLayer({ color }));
    paletteGrid.appendChild(btn);
  });

  palettePanel.appendChild(paletteGrid);

  // ── Crayons tab ───────────────────────────────────────────────────────────
  const crayonsPanel = document.createElement('div');
  crayonsPanel.className = 'color-tab-panel';
  crayonsPanel.hidden = true;
  tabPanels['Crayons'] = crayonsPanel;

  const crayonGrid = document.createElement('div');
  crayonGrid.className = 'color-grid crayon-grid';

  CRAYONS.forEach((crayon: CrayonColor) => {
    const btn = document.createElement('button');
    btn.className = 'color-swatch crayon-swatch';
    btn.dataset['hex'] = crayon.hex;
    btn.dataset['name'] = crayon.name;
    btn.title = crayon.name;
    btn.style.background = crayon.hex;
    if (crayon.hex === '#ffffff') btn.style.boxShadow = 'inset 0 0 0 1px #555';
    btn.addEventListener('click', () => {
      updateTextLayer({ color: { kind: 'solid', hex: crayon.hex, name: crayon.name } });
    });
    crayonGrid.appendChild(btn);
  });

  crayonsPanel.appendChild(crayonGrid);

  // ── Custom tab ─────────────────────────────────────────────────────────────
  const customPanel = document.createElement('div');
  customPanel.className = 'color-tab-panel custom-panel';
  customPanel.hidden = true;
  tabPanels['Custom'] = customPanel;

  // Color preview swatch
  const customPreview = document.createElement('div');
  customPreview.className = 'custom-preview';

  // Sliders
  function makeSlider(label: string, id: string): { row: HTMLDivElement; input: HTMLInputElement; valSpan: HTMLSpanElement } {
    const row = document.createElement('div');
    row.className = 'rgb-row';

    const lbl = document.createElement('label');
    lbl.textContent = label;
    lbl.className = 'rgb-label';
    lbl.htmlFor = id;

    const input = document.createElement('input');
    input.type = 'range';
    input.id = id;
    input.className = 'rgb-slider';
    input.min = '0';
    input.max = '255';
    input.step = '1';

    const valSpan = document.createElement('span');
    valSpan.className = 'rgb-value';
    valSpan.textContent = '0';

    input.addEventListener('input', () => {
      valSpan.textContent = input.value;
    });

    row.append(lbl, input, valSpan);
    return { row, input, valSpan };
  }

  const { row: rRow, input: rInput, valSpan: rVal } = makeSlider('R', 'custom-r');
  const { row: gRow, input: gInput, valSpan: gVal } = makeSlider('G', 'custom-g');
  const { row: bRow, input: bInput, valSpan: bVal } = makeSlider('B', 'custom-b');

  // Hex input
  const hexRow = document.createElement('div');
  hexRow.className = 'hex-row';

  const hexLabel = document.createElement('label');
  hexLabel.textContent = 'Hex';
  hexLabel.className = 'rgb-label';
  hexLabel.htmlFor = 'custom-hex';

  const hexInput = document.createElement('input');
  hexInput.type = 'text';
  hexInput.id = 'custom-hex';
  hexInput.className = 'hex-input';
  hexInput.maxLength = 7;
  hexInput.placeholder = '#ffffff';
  hexInput.spellcheck = false;

  hexRow.append(hexLabel, hexInput);

  let updatingFromSliders = false;
  let updatingFromHex = false;

  function updatePreviewAndLayer(hex: string): void {
    customPreview.style.background = hex;
    updateTextLayer({ color: { kind: 'solid', hex, name: 'Custom' } });
  }

  function syncSlidersFromHex(hex: string): void {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    const { r, g, b } = hexToRgb(hex);
    rInput.value = String(r);
    gInput.value = String(g);
    bInput.value = String(b);
    rVal.textContent = String(r);
    gVal.textContent = String(g);
    bVal.textContent = String(b);
  }

  [rInput, gInput, bInput].forEach((inp) => {
    inp.addEventListener('input', () => {
      if (updatingFromHex) return;
      updatingFromSliders = true;
      const hex = rgbToHex(parseInt(rInput.value), parseInt(gInput.value), parseInt(bInput.value));
      hexInput.value = hex;
      updatePreviewAndLayer(hex);
      updatingFromSliders = false;
    });
  });

  hexInput.addEventListener('input', () => {
    if (updatingFromSliders) return;
    let val = hexInput.value;
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-f]{6}$/i.test(val)) {
      updatingFromHex = true;
      syncSlidersFromHex(val);
      updatePreviewAndLayer(val);
      updatingFromHex = false;
    }
  });

  customPanel.append(customPreview, rRow, gRow, bRow, hexRow);

  // Initialize custom panel from current solid color when switching to that tab
  function initCustomFromLayer(): void {
    const layer = getTextLayer();
    let hex = '#ff0000';
    if (layer.color.kind === 'solid') hex = layer.color.hex;
    hexInput.value = hex;
    syncSlidersFromHex(hex);
    customPreview.style.background = hex;
  }

  tabs.forEach((name) => {
    tabBtns[name].addEventListener('click', () => {
      if (name === 'Custom') initCustomFromLayer();
      switchTab(name);
    });
  });

  wrapper.append(palettePanel, crayonsPanel, customPanel);

  // Active swatch tracking
  function updateActive(): void {
    const layer = getTextLayer();
    const id = colorId(layer.color);

    paletteGrid.querySelectorAll<HTMLButtonElement>('.color-swatch').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset['id'] === id);
    });

    // Highlight crayon swatch if current color matches by hex
    crayonGrid.querySelectorAll<HTMLButtonElement>('.crayon-swatch').forEach((btn) => {
      const matches =
        layer.color.kind === 'solid' && btn.dataset['hex'] === layer.color.hex;
      btn.classList.toggle('active', matches);
    });
  }

  onLayerChange(updateActive);
  container.appendChild(wrapper);

  // Init tab state
  switchTab('Palette');
  updateActive();
}
