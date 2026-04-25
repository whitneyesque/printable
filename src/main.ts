import './style.css';
import { BRAND_CHARTS } from './data/size-charts';
import { getCurrentGarment, onGarmentChange, setPaperSizeIndex, getPaperSizeIndex } from './state/design';
import { getCalibration, clearCalibration } from './state/calibration';
import { startCalibration } from './canvas/calibration';
import { renderCanvas } from './canvas/renderer';
import { renderGarmentPicker } from './ui/garment-picker';
import { renderFontPicker } from './ui/font-picker';
import { renderColorPicker } from './ui/color-picker';
import { renderTextPanel } from './ui/text-panel';
import { openExportDialog } from './ui/export-dialog';
import { PAPER_SIZES } from './canvas/export-png';

const app = document.getElementById('app')!;

const pickerEl = document.createElement('div');
pickerEl.id = 'picker';

const workspaceEl = document.createElement('div');
workspaceEl.id = 'workspace';

const canvasEl = document.createElement('div');
canvasEl.id = 'canvas-container';

const controlsEl = document.createElement('div');
controlsEl.id = 'controls';

workspaceEl.appendChild(canvasEl);
workspaceEl.appendChild(controlsEl);
app.appendChild(pickerEl);
app.appendChild(workspaceEl);

renderGarmentPicker(pickerEl);
renderTextPanel(controlsEl);
renderFontPicker(controlsEl);
renderColorPicker(controlsEl);

// Paper size selector
const paperSection = document.createElement('div');

const paperHeading = document.createElement('h3');
paperHeading.textContent = 'Paper Size';

const paperSelect = document.createElement('select');
paperSelect.className = 'panel-input';
PAPER_SIZES.forEach((size, i) => {
  const opt = document.createElement('option');
  opt.value = String(i);
  opt.textContent = size.label;
  paperSelect.appendChild(opt);
});
paperSelect.value = String(getPaperSizeIndex()); // sync to state default
paperSelect.addEventListener('change', () => {
  setPaperSizeIndex(parseInt(paperSelect.value));
});

paperSection.appendChild(paperHeading);
paperSection.appendChild(paperSelect);
controlsEl.appendChild(paperSection);

// Reset calibration button
const resetCalBtn = document.createElement('button');
resetCalBtn.textContent = 'Reset Calibration';
resetCalBtn.className = 'reset-cal-btn';
resetCalBtn.addEventListener('click', () => {
  const garment = getCurrentGarment();
  clearCalibration(garment.id);
  loadGarment();
});
controlsEl.appendChild(resetCalBtn);

// Export button (pushed to bottom)
const exportOpenBtn = document.createElement('button');
exportOpenBtn.textContent = 'Export PNG…';
exportOpenBtn.className = 'export-open-btn';
exportOpenBtn.addEventListener('click', () => openExportDialog());
controlsEl.appendChild(exportOpenBtn);

function loadGarment(): void {
  const garment = getCurrentGarment();
  const sizeRecord = BRAND_CHARTS[garment.brand][garment.size];
  const calibration = getCalibration(garment.id);

  if (!calibration) {
    startCalibration(garment, sizeRecord, () => {
      const cal = getCalibration(garment.id)!;
      renderCanvas(canvasEl, garment, sizeRecord, cal);
    });
  } else {
    renderCanvas(canvasEl, garment, sizeRecord, calibration);
  }
}

onGarmentChange(loadGarment);
loadGarment();
