import { PAPER_SIZES, isOversized, exportPng } from '../canvas/export-png';
import { getTextLayer } from '../state/design';

export function openExportDialog(): void {
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'export-dialog';

  const heading = document.createElement('h2');
  heading.textContent = 'Export';

  // Paper size
  const paperLabel = document.createElement('label');
  paperLabel.textContent = 'Paper size';
  paperLabel.className = 'panel-label';

  const paperSelect = document.createElement('select');
  paperSelect.className = 'panel-input';
  PAPER_SIZES.forEach((size, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = size.label;
    paperSelect.appendChild(opt);
  });

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

  function checkSize(): void {
    const paper = PAPER_SIZES[parseInt(paperSelect.value)];
    warning.hidden = !isOversized(getTextLayer(), paper);
  }
  paperSelect.addEventListener('change', checkSize);

  // Buttons
  const btnRow = document.createElement('div');
  btnRow.className = 'dialog-btn-row';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'cancel-btn';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export PNG';
  exportBtn.className = 'export-btn';
  exportBtn.addEventListener('click', () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Exporting…';
    const paper = PAPER_SIZES[parseInt(paperSelect.value)];
    exportPng(getTextLayer(), paper, mirrorCheckbox.checked)
      .then(() => overlay.remove())
      .catch(() => {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export PNG';
      });
  });

  btnRow.append(cancelBtn, exportBtn);
  dialog.append(heading, paperLabel, paperSelect, mirrorRow, warning, btnRow);
  overlay.appendChild(dialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  checkSize();
}
