import type { Garment } from '../data/garments/types';
import type { GarmentType } from '../data/garments/types';
import type { SizeRecord } from '../data/garments/types';
import { setCalibration } from '../state/calibration';

const PROMPTS: Record<GarmentType, string> = {
  tank: 'Click the left and right edges of the chest, just below the armholes.',
  dress: 'Click the left and right edges of the bodice at its widest point.',
  tee: 'Click shoulder seam to shoulder seam.',
};

export function startCalibration(
  garment: Garment,
  sizeRecord: SizeRecord,
  onComplete: () => void,
): void {
  const overlay = document.createElement('div');
  overlay.className = 'cal-overlay';

  const modal = document.createElement('div');
  modal.className = 'cal-modal';

  const heading = document.createElement('h2');
  heading.textContent = 'Calibrate';

  const instruction = document.createElement('p');
  instruction.textContent = PROMPTS[garment.type];

  const imgWrap = document.createElement('div');
  imgWrap.className = 'cal-img-wrap';

  const img = document.createElement('img');
  img.src = import.meta.env.BASE_URL + garment.image;
  img.className = 'cal-img';
  img.draggable = false;

  imgWrap.appendChild(img);
  modal.append(heading, instruction, imgWrap);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  let firstNaturalX: number | null = null;

  function placeMarker(cssX: number, cssY: number, label: string): void {
    const dot = document.createElement('div');
    dot.className = 'cal-marker';
    dot.textContent = label;
    dot.style.left = `${cssX}px`;
    dot.style.top = `${cssY}px`;
    imgWrap.appendChild(dot);
  }

  img.addEventListener('click', (e: MouseEvent) => {
    if (img.naturalWidth === 0) return;

    const rect = img.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const naturalX = cssX * (img.naturalWidth / rect.width);

    if (firstNaturalX === null) {
      firstNaturalX = naturalX;
      placeMarker(cssX, cssY, '1');
    } else {
      placeMarker(cssX, cssY, '2');
      const naturalDist = Math.abs(naturalX - firstNaturalX);
      setCalibration(garment.id, {
        naturalPixelsPerInch: naturalDist / sizeRecord.chestWidthIn,
      });
      overlay.remove();
      onComplete();
    }
  });
}
