import type { Garment } from '../data/garments/types';
import type { SizeRecord } from '../data/garments/types';
import type { CalibrationRecord } from '../state/calibration';
import type { TextLayer } from '../state/design';
import type { PaletteColor } from '../data/palette/types';
import { getTextLayer, updateTextLayer, onLayerChange, getPaperSizeIndex, onPaperSizeChange } from '../state/design';
import { FONTS } from '../data/fonts/index';
import { PAPER_SIZES } from './export-png';
import { setupDrag, setupResizeHandle } from './interactions';

const SVG_NS = 'http://www.w3.org/2000/svg';
const UNITS_PER_INCH = 100;
const GRADIENT_ID = 'text-fill';

let unsubscribeLayer: (() => void) | null = null;
let unsubscribePaper: (() => void) | null = null;

export function renderCanvas(
  container: HTMLElement,
  garment: Garment,
  _sizeRecord: SizeRecord,
  calibration: CalibrationRecord,
): void {
  unsubscribeLayer?.();
  unsubscribeLayer = null;
  unsubscribePaper?.();
  unsubscribePaper = null;
  container.innerHTML = '';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.style.width = '100%';
  svg.style.display = 'block';
  container.appendChild(svg);

  const probe = new Image();
  probe.onload = () => {
    const { naturalWidth, naturalHeight } = probe;
    const { naturalPixelsPerInch } = calibration;

    const viewBoxW = (naturalWidth / naturalPixelsPerInch) * UNITS_PER_INCH;
    const viewBoxH = (naturalHeight / naturalPixelsPerInch) * UNITS_PER_INCH;
    svg.setAttribute('viewBox', `0 0 ${viewBoxW} ${viewBoxH}`);

    // Defs for gradient fills
    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);
    let gradientEl: SVGLinearGradientElement | SVGRadialGradientElement | null = null;

    const imgEl = document.createElementNS(SVG_NS, 'image');
    imgEl.setAttribute('href', import.meta.env.BASE_URL + garment.image);
    imgEl.setAttribute('x', '0');
    imgEl.setAttribute('y', '0');
    imgEl.setAttribute('width', String(viewBoxW));
    imgEl.setAttribute('height', String(viewBoxH));
    svg.appendChild(imgEl);

    // Paper boundary (black dashed) — centered horizontally, anchored at 15% from top
    const paperRect = document.createElementNS(SVG_NS, 'rect');
    paperRect.setAttribute('fill', 'none');
    paperRect.setAttribute('stroke', '#000');
    paperRect.setAttribute('stroke-width', '2');
    paperRect.setAttribute('stroke-dasharray', '10 5');
    paperRect.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(paperRect);

    function updatePaperRect(): void {
      const paper = PAPER_SIZES[getPaperSizeIndex()];
      const pW = paper.widthIn * UNITS_PER_INCH;
      const pH = paper.heightIn * UNITS_PER_INCH;
      paperRect.setAttribute('x', String((viewBoxW - pW) / 2));
      paperRect.setAttribute('y', String(viewBoxH * 0.15));
      paperRect.setAttribute('width', String(pW));
      paperRect.setAttribute('height', String(pH));
    }
    updatePaperRect();
    unsubscribePaper = onPaperSizeChange(() => updatePaperRect());

    // Text element
    const textEl = document.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'central');
    svg.appendChild(textEl);

    // Resize handle circle
    const handle = document.createElementNS(SVG_NS, 'circle');
    handle.setAttribute('r', '8');
    handle.setAttribute('fill', 'white');
    handle.setAttribute('stroke', '#444');
    handle.setAttribute('stroke-width', '1.5');
    handle.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(handle);

    function repositionHandle(): void {
      try {
        const bbox = textEl.getBBox();
        handle.setAttribute('cx', String(bbox.x + bbox.width));
        handle.setAttribute('cy', String(bbox.y + bbox.height));
      } catch {
        // ignore if not yet rendered
      }
    }

    // Build an SVG gradient element from a PaletteColor and return it
    function buildGradient(
      color: Extract<PaletteColor, { kind: 'linear-gradient' | 'radial-gradient' }>,
    ): SVGLinearGradientElement | SVGRadialGradientElement {
      const tag = color.kind === 'linear-gradient' ? 'linearGradient' : 'radialGradient';
      const g = document.createElementNS(SVG_NS, tag) as
        | SVGLinearGradientElement
        | SVGRadialGradientElement;
      g.setAttribute('id', GRADIENT_ID);
      g.setAttribute('gradientUnits', 'userSpaceOnUse');
      color.stops.forEach((s) => {
        const stop = document.createElementNS(SVG_NS, 'stop');
        stop.setAttribute('offset', `${s.offset * 100}%`);
        stop.setAttribute('stop-color', s.hex);
        g.appendChild(stop);
      });
      return g;
    }

    // Position gradient coordinates to span the text bounding box
    function positionGradient(color: PaletteColor): void {
      if (!gradientEl) return;
      try {
        const bbox = textEl.getBBox();
        if (!bbox.width) return;
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        if (color.kind === 'linear-gradient') {
          const rad = (color.angle * Math.PI) / 180;
          const dx = Math.sin(rad) * (bbox.width / 2);
          const dy = -Math.cos(rad) * (bbox.height / 2);
          gradientEl.setAttribute('x1', String(cx - dx));
          gradientEl.setAttribute('y1', String(cy - dy));
          gradientEl.setAttribute('x2', String(cx + dx));
          gradientEl.setAttribute('y2', String(cy + dy));
        } else if (color.kind === 'radial-gradient') {
          const r = Math.max(bbox.width, bbox.height) / 2;
          gradientEl.setAttribute('cx', String(cx));
          gradientEl.setAttribute('cy', String(cy));
          gradientEl.setAttribute('r', String(r));
        }
      } catch {
        // not yet in DOM
      }
    }

    function applyLayer(layer: TextLayer): void {
      const font = FONTS.find((f) => f.id === layer.fontId) ?? FONTS[0];
      textEl.setAttribute('font-family', `'${font.family}', sans-serif`);
      textEl.setAttribute('font-size', String(layer.sizeIn * UNITS_PER_INCH));
      textEl.setAttribute('font-weight', layer.bold && font.hasBold ? 'bold' : 'normal');
      textEl.setAttribute('font-style', layer.italic && font.hasItalic ? 'italic' : 'normal');
      textEl.textContent = layer.text;

      // Rebuild gradient definition if needed
      gradientEl?.remove();
      gradientEl = null;

      const { color } = layer;
      if (color.kind === 'solid') {
        textEl.setAttribute('fill', color.hex);
      } else if (color.kind === 'linear-gradient' || color.kind === 'radial-gradient') {
        gradientEl = buildGradient(color);
        defs.appendChild(gradientEl);
        textEl.setAttribute('fill', `url(#${GRADIENT_ID})`);
        requestAnimationFrame(() => positionGradient(color));
      } else {
        textEl.setAttribute('fill', '#ffffff');
      }
    }

    // Center text on paper if not yet positioned for this garment
    const initialLayer = getTextLayer();
    if (initialLayer.x === 0 && initialLayer.y === 0) {
      const paper = PAPER_SIZES[getPaperSizeIndex()];
      const pW = paper.widthIn * UNITS_PER_INCH;
      const pH = paper.heightIn * UNITS_PER_INCH;
      const paperX = (viewBoxW - pW) / 2;
      const paperY = viewBoxH * 0.15;
      updateTextLayer({ x: paperX + pW / 2, y: paperY + pH / 2 });
    }

    applyLayer(getTextLayer());
    textEl.setAttribute('x', String(getTextLayer().x));
    textEl.setAttribute('y', String(getTextLayer().y));
    requestAnimationFrame(repositionHandle);

    setupDrag(
      svg,
      textEl,
      () => ({ x: getTextLayer().x, y: getTextLayer().y }),
      (x, y) => updateTextLayer({ x, y }),
    );

    setupResizeHandle(
      svg,
      handle,
      () => getTextLayer().sizeIn,
      (sizeIn) => updateTextLayer({ sizeIn }),
    );

    unsubscribeLayer = onLayerChange((updated) => {
      applyLayer(updated);
      textEl.setAttribute('x', String(updated.x));
      textEl.setAttribute('y', String(updated.y));
      requestAnimationFrame(() => {
        repositionHandle();
        positionGradient(updated.color);
      });
    });
  };

  probe.src = import.meta.env.BASE_URL + garment.image;
}
