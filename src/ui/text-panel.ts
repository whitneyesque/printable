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

  // Size row
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

  // Curve row
  const curveSection = document.createElement('div');
  curveSection.className = 'panel-section';

  const curveLabelRow = document.createElement('div');
  curveLabelRow.className = 'panel-row';

  const curveLabel = document.createElement('span');
  curveLabel.textContent = 'Curve';
  curveLabel.className = 'panel-label';

  const curveValueDisplay = document.createElement('span');
  curveValueDisplay.className = 'unit-label curve-value';
  curveValueDisplay.textContent = '0 in';

  curveLabelRow.append(curveLabel, curveValueDisplay);

  const curveSlider = document.createElement('input');
  curveSlider.type = 'range';
  curveSlider.className = 'curve-slider';
  curveSlider.min = '-6';
  curveSlider.max = '6';
  curveSlider.step = '0.5';
  curveSlider.value = String(getTextLayer().curve);

  curveSlider.addEventListener('input', () => {
    const val = parseFloat(curveSlider.value);
    updateTextLayer({ curve: val });
  });

  curveSection.append(curveLabelRow, curveSlider);

  // Outline row
  const outlineSection = document.createElement('div');
  outlineSection.className = 'panel-section';

  const outlineLabelRow = document.createElement('div');
  outlineLabelRow.className = 'panel-row';

  const outlineLabel = document.createElement('span');
  outlineLabel.textContent = 'Outline';
  outlineLabel.className = 'panel-label';

  outlineLabelRow.appendChild(outlineLabel);

  const outlineInputRow = document.createElement('div');
  outlineInputRow.className = 'panel-row';

  const outlineWidthInput = document.createElement('input');
  outlineWidthInput.type = 'number';
  outlineWidthInput.className = 'panel-input size-input';
  outlineWidthInput.min = '0';
  outlineWidthInput.max = '0.5';
  outlineWidthInput.step = '0.02';
  outlineWidthInput.value = String(getTextLayer().outlineWidth);
  outlineWidthInput.title = 'Outline width in inches';

  const outlineUnit = document.createElement('span');
  outlineUnit.textContent = 'in';
  outlineUnit.className = 'unit-label';

  const outlineColorInput = document.createElement('input');
  outlineColorInput.type = 'color';
  outlineColorInput.className = 'outline-color-input';
  outlineColorInput.value = getTextLayer().outlineColor;
  outlineColorInput.title = 'Outline color';

  outlineWidthInput.addEventListener('input', () => {
    const val = parseFloat(outlineWidthInput.value);
    if (isFinite(val) && val >= 0) updateTextLayer({ outlineWidth: val });
  });

  outlineColorInput.addEventListener('input', () => {
    updateTextLayer({ outlineColor: outlineColorInput.value });
  });

  outlineInputRow.append(outlineWidthInput, outlineUnit, outlineColorInput);
  outlineSection.append(outlineLabelRow, outlineInputRow);

  wrapper.append(textLabel, textInput, sizeRow, styleRow, curveSection, outlineSection);
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

    if (document.activeElement !== curveSlider) {
      curveSlider.value = String(layer.curve);
    }
    curveValueDisplay.textContent = `${layer.curve > 0 ? '+' : ''}${layer.curve} in`;

    if (document.activeElement !== outlineWidthInput) {
      outlineWidthInput.value = String(layer.outlineWidth);
    }
    if (document.activeElement !== outlineColorInput) {
      outlineColorInput.value = layer.outlineColor;
    }
  }

  onLayerChange(syncControls);
  syncControls();
}
