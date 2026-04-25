import { FONTS } from '../data/fonts/index';
import { getTextLayer, updateTextLayer, onLayerChange } from '../state/design';

export function renderTextPanel(container: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'text-panel';

  // Text input
  const textLabel = document.createElement('label');
  textLabel.textContent = 'Text';
  textLabel.className = 'panel-label';

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.className = 'panel-input';
  textInput.value = getTextLayer().text;
  textInput.addEventListener('input', () => {
    updateTextLayer({ text: textInput.value });
  });

  // Size input
  const sizeRow = document.createElement('div');
  sizeRow.className = 'panel-row';

  const sizeLabel = document.createElement('label');
  sizeLabel.textContent = 'Size';
  sizeLabel.className = 'panel-label';

  const sizeInput = document.createElement('input');
  sizeInput.type = 'number';
  sizeInput.className = 'panel-input size-input';
  sizeInput.min = '0.25';
  sizeInput.max = '6';
  sizeInput.step = '0.25';
  sizeInput.value = String(getTextLayer().sizeIn);
  sizeInput.addEventListener('input', () => {
    const val = parseFloat(sizeInput.value);
    if (isFinite(val) && val >= 0.25) updateTextLayer({ sizeIn: val });
  });

  const sizeUnit = document.createElement('span');
  sizeUnit.textContent = 'in';
  sizeUnit.className = 'unit-label';

  sizeRow.append(sizeLabel, sizeInput, sizeUnit);

  // Bold / Italic buttons
  const styleRow = document.createElement('div');
  styleRow.className = 'panel-row style-row';

  const boldBtn = document.createElement('button');
  boldBtn.textContent = 'B';
  boldBtn.className = 'style-btn bold-btn';
  boldBtn.addEventListener('click', () => {
    updateTextLayer({ bold: !getTextLayer().bold });
  });

  const italicBtn = document.createElement('button');
  italicBtn.textContent = 'I';
  italicBtn.className = 'style-btn italic-btn';
  italicBtn.addEventListener('click', () => {
    updateTextLayer({ italic: !getTextLayer().italic });
  });

  styleRow.append(boldBtn, italicBtn);

  // Outline
  const outlineRow = document.createElement('div');
  outlineRow.className = 'panel-row';

  const outlineLabel = document.createElement('label');
  outlineLabel.textContent = 'Outline';
  outlineLabel.className = 'panel-label';

  const outlineInput = document.createElement('input');
  outlineInput.type = 'number';
  outlineInput.className = 'panel-input size-input';
  outlineInput.min = '0';
  outlineInput.max = '0.25';
  outlineInput.step = '0.01';
  outlineInput.value = String(getTextLayer().outlineWidth);
  outlineInput.title = 'Outline width in inches (0 = none)';
  outlineInput.addEventListener('input', () => {
    const val = parseFloat(outlineInput.value);
    if (isFinite(val) && val >= 0) updateTextLayer({ outlineWidth: val });
  });

  const outlineUnit = document.createElement('span');
  outlineUnit.textContent = 'in';
  outlineUnit.className = 'unit-label';

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  outlineColorInput.className = 'outline-color-input';
  outlineColorInput.value = getTextLayer().outlineColor;
  outlineColorInput.title = 'Outline color';
  outlineColorInput.addEventListener('input', () => {
    updateTextLayer({ outlineColor: outlineColorInput.value });
  });

  outlineRow.append(outlineLabel, outlineInput, outlineUnit, outlineColorInput);

  wrapper.append(textLabel, textInput, sizeRow, styleRow, outlineRow);
  container.appendChild(wrapper);

  function syncControls(): void {
    const layer = getTextLayer();
    const font = FONTS.find((f) => f.id === layer.fontId) ?? FONTS[0];

    if (document.activeElement !== textInput) textInput.value = layer.text;
    if (document.activeElement !== sizeInput) {
      sizeInput.value = String(Math.round(layer.sizeIn * 100) / 100);
    }
    if (document.activeElement !== outlineInput) {
      outlineInput.value = String(Math.round(layer.outlineWidth * 100) / 100);
    }
    outlineColorInput.value = layer.outlineColor;

    boldBtn.disabled = !font.hasBold;
    boldBtn.classList.toggle('active', layer.bold);
    italicBtn.disabled = !font.hasItalic;
    italicBtn.classList.toggle('active', layer.italic);
  }

  onLayerChange(syncControls);
  syncControls();
}
