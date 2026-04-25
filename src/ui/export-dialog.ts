import { PAPER_SIZES, isOversized, exportPng, renderPreview } from '../canvas/export-png';
import { getTextLayer, getPaperSizeIndex } from '../state/design';

export function openExportDialog(): void {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'export-dialog';

  const heading = document.createElement('h2');
  heading.textContent = 'Export';

  // Preview canvas — checkerboard background so any text color is visible
  const previewWrap = document.createElement('div');
  previewWrap.className = 'export-preview-wrap';

  const previewCanvas = document.createElement('canvas');
  previewCanvas.className = 'export-preview-canvas';
  previewWrap.appendChild(previewCanvas);

  // Mirror toggle
  const mirrorRow = document.createElement('div');
  mirrorRow.className = 'mirror-row';

  const mirrorCheckbox = document.createElement('input');
  mirrorCheckbox.type = 'checkbox';
  mirrorCheckbox.id = 'mirror-toggle';
  mirrorCheckbox.checked = true;

  const mirrorLabel = document.createElement('label');
  mirrorLabel.htmlFor = 'mirror-toggle';
  mirrorLabel.textContent = 'Mirror (required for iron-on transfers)';

  mirrorRow.append(mirrorCheckbox, mirrorLabel);

  // Oversize warning
  const warning = document.createElement('p');
  warning.className = 'export-warning';
  warning.hidden = true;
  warning.textContent = 'Text is wider than the selected paper and will be clipped.';

  function refresh(): void {
    const paper = PAPER_SIZES[getPaperSizeIndex()];
    warning.hidden = !isOversized(getTextLayer(), paper);
    void renderPreview(previewCanvas, getTextLayer(), paper, mirrorCheckbox.checked);
  }

  mirrorCheckbox.addEventListener('change', refresh);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'dialog-btn-row';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Download PNG';
  exportBtn.className = 'export-btn';
  exportBtn.addEventListener('click', () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Downloading…';
    const paper = PAPER_SIZES[getPaperSizeIndex()];
    exportPng(getTextLayer(), paper, mirrorCheckbox.checked)
      .then(() => overlay.remove())
      .catch(() => {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Download PNG';
      });
  });

  btnRow.append(cancelBtn, exportBtn);
  dialog.append(heading, previewWrap, mirrorRow, warning, btnRow);
  overlay.appendChild(dialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  refresh();
}
