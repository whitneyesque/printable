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

  wrapper.append(textLabel, textInput, sizeRow, styleRow);
  container.appendChild(wrapper);

  function syncControls(): void {
    const layer = getTextLayer();
    const font = FONTS.find((f) => f.id === layer.fontId) ?? FONTS[0];

    if (document.activeElement !== textInput) textInput.value = layer.text;
    if (document.activeElement !== sizeInput) {
      sizeInput.value = String(Math.round(layer.sizeIn * 100) / 100);
    }

    boldBtn.disabled = !font.hasBold;
    boldBtn.classList.toggle('active', layer.bold);
    italicBtn.disabled = !font.hasItalic;
    italicBtn.classList.toggle('active', layer.italic);
  }

  onLayerChange(syncControls);
  syncControls();
}
