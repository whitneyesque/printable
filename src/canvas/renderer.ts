import type { Garment } from '../data/garments/types';
import type { SizeRecord } from '../data/garments/types';
import type { CalibrationRecord } from '../state/calibration';
import type { TextLayer } from '../state/design';
import type { PaletteColor } from '../data/palette/types';
import { getTextLayer, updateTextLayer, onLayerChange, getPaperSizeIndex, onPaperSizeChange } from '../state/design';
import { FONTS } from '../data/fonts/index';
import { PAPER_SIZES } from './export-png';
import { setupDrag, setupResizeHandle, setupRotationHandle } from './interactions';

const SVG_NS = 'http://www.w3.org/2000/svg';
const UNITS_PER_INCH = 100;
const GRADIENT_ID = 'text-fill';
const ARC_PATH_ID = 'text-arc';
const ROT_HANDLE_DIST = 60; // SVG units above text center

let unsubscribeLayer: (() => void) | null = null;
let unsubscribePaper: (() => void) | null = null;

function rainbowHsl(i: number, total: number): string {
  return `hsl(${Math.round((i / Math.max(total - 1, 1)) * 300)}, 100%, 50%)`;
}

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

    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);

    // Arc path for curved text
    const arcPathEl = document.createElementNS(SVG_NS, 'path');
    arcPathEl.setAttribute('id', ARC_PATH_ID);
    defs.appendChild(arcPathEl);

    let gradientEl: SVGLinearGradientElement | SVGRadialGradientElement | null = null;

    const imgEl = document.createElementNS(SVG_NS, 'image');
    imgEl.setAttribute('href', import.meta.env.BASE_URL + garment.image);
    imgEl.setAttribute('x', '0');
    imgEl.setAttribute('y', '0');
    imgEl.setAttribute('width', String(viewBoxW));
    imgEl.setAttribute('height', String(viewBoxH));
    svg.appendChild(imgEl);

    // Paper boundary (black dashed)
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

    const textEl = document.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('text-anchor', 'middle');
    svg.appendChild(textEl);

    // Resize handle (bottom-right of text bbox)
    const resizeHandle = document.createElementNS(SVG_NS, 'circle');
    resizeHandle.setAttribute('r', '8');
    resizeHandle.setAttribute('fill', 'white');
    resizeHandle.setAttribute('stroke', '#444');
    resizeHandle.setAttribute('stroke-width', '1.5');
    resizeHandle.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(resizeHandle);

    // Rotation handle — dashed line + circle above text center
    const rotLine = document.createElementNS(SVG_NS, 'line');
    rotLine.setAttribute('stroke', '#fff');
    rotLine.setAttribute('stroke-width', '1.5');
    rotLine.setAttribute('stroke-dasharray', '4 3');
    rotLine.setAttribute('vector-effect', 'non-scaling-stroke');
    rotLine.setAttribute('pointer-events', 'none');
    svg.appendChild(rotLine);

    const rotHandle = document.createElementNS(SVG_NS, 'circle');
    rotHandle.setAttribute('r', '8');
    rotHandle.setAttribute('fill', 'white');
    rotHandle.setAttribute('stroke', '#444');
    rotHandle.setAttribute('stroke-width', '1.5');
    rotHandle.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(rotHandle);

    function repositionHandles(layer: TextLayer): void {
      try {
        const bbox = textEl.getBBox();
        resizeHandle.setAttribute('cx', String(bbox.x + bbox.width));
        resizeHandle.setAttribute('cy', String(bbox.y + bbox.height));
      } catch {
        // not yet rendered
      }
      // Rotation handle: offset above text center along the rotation axis
      const rad = (layer.rotation * Math.PI) / 180;
      const hx = layer.x - Math.sin(rad) * ROT_HANDLE_DIST;
      const hy = layer.y - Math.cos(rad) * ROT_HANDLE_DIST;
      rotHandle.setAttribute('cx', String(hx));
      rotHandle.setAttribute('cy', String(hy));
      rotLine.setAttribute('x1', String(layer.x));
      rotLine.setAttribute('y1', String(layer.y));
      rotLine.setAttribute('x2', String(hx));
      rotLine.setAttribute('y2', String(hy));
    }

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

    function positionGradient(color: PaletteColor): void {
      if (!gradientEl) return;
      try {
        const bbox = textEl.getBBox();
        if (!bbox.width) return;
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        if (color.kind === 'linear-gradient') {
          const rad = (color.angle * Math.PI) / 180;
          gradientEl.setAttribute('x1', String(cx - Math.sin(rad) * bbox.width / 2));
          gradientEl.setAttribute('y1', String(cy + Math.cos(rad) * bbox.height / 2));
          gradientEl.setAttribute('x2', String(cx + Math.sin(rad) * bbox.width / 2));
          gradientEl.setAttribute('y2', String(cy - Math.cos(rad) * bbox.height / 2));
        } else if (color.kind === 'radial-gradient') {
          const r = Math.max(bbox.width, bbox.height) / 2;
          gradientEl.setAttribute('cx', String(cx));
          gradientEl.setAttribute('cy', String(cy));
          gradientEl.setAttribute('r', String(r));
        }
      } catch { /* not yet in DOM */ }
    }

    // Update the arc path in <defs> based on current layer position and curve.
    // curve is a signed intensity (±1–10); larger absolute value = tighter arch.
    // R = 1000 / |curve| SVG units keeps small values gentle and large values dramatic.
    function updateArcPath(layer: TextLayer): void {
      const R = 1000 / Math.abs(layer.curve);
      const cx = layer.x;
      const cy = layer.y;
      // SVG text baseline sits ON the arc; characters extend upward (-y) from the baseline.
      // Without compensation the text visually floats above layer.y.
      // Shift the arc down by half the font height so the visual center stays at layer.y.
      const halfFontH = (layer.sizeIn * UNITS_PER_INCH) / 2;
      if (layer.curve > 0) {
        // Upward arch: arc top at cy + halfFontH, so text center lands at cy
        arcPathEl.setAttribute(
          'd',
          `M ${cx - R},${cy + halfFontH + R} A ${R},${R} 0 0,0 ${cx + R},${cy + halfFontH + R}`,
        );
      } else {
        // Downward arch: arc bottom at cy + halfFontH, so text center lands at cy
        arcPathEl.setAttribute(
          'd',
          `M ${cx - R},${cy + halfFontH - R} A ${R},${R} 0 0,1 ${cx + R},${cy + halfFontH - R}`,
        );
      }
    }

    // Build the text element's content and fill for the current layer
    function applyLayer(layer: TextLayer): void {
      const font = FONTS.find((f) => f.id === layer.fontId) ?? FONTS[0];

      // Font attributes
      textEl.setAttribute('font-family', `'${font.family}', sans-serif`);
      textEl.setAttribute('font-size', String(layer.sizeIn * UNITS_PER_INCH));
      textEl.setAttribute('font-weight', layer.bold && font.hasBold ? 'bold' : 'normal');
      textEl.setAttribute('font-style', layer.italic && font.hasItalic ? 'italic' : 'normal');

      // Rotation (only applied when not curved — curve has its own path orientation)
      if (layer.curve === 0 && layer.rotation !== 0) {
        textEl.setAttribute('transform', `rotate(${layer.rotation}, ${layer.x}, ${layer.y})`);
      } else {
        textEl.removeAttribute('transform');
      }

      // Outline
      if (layer.outlineWidth > 0) {
        textEl.setAttribute('stroke', layer.outlineColor);
        textEl.setAttribute('stroke-width', String(layer.outlineWidth * UNITS_PER_INCH));
        textEl.setAttribute('paint-order', 'stroke fill');
        textEl.setAttribute('stroke-linejoin', 'round');
      } else {
        textEl.removeAttribute('stroke');
        textEl.removeAttribute('stroke-width');
        textEl.removeAttribute('paint-order');
      }

      // Gradient rebuild
      gradientEl?.remove();
      gradientEl = null;

      const { color } = layer;
      const isCurved = layer.curve !== 0;
      const isRainbow = color.kind === 'per-letter';

      // Clear content — we'll repopulate based on mode
      textEl.innerHTML = '';

      if (isCurved) {
        // Update the arc path
        updateArcPath(layer);

        // Positioning via textPath, not x/y
        textEl.removeAttribute('x');
        textEl.removeAttribute('y');
        textEl.removeAttribute('dominant-baseline');

        if (isRainbow) {
          // Each character gets its own tspan inside one textPath
          const tp = document.createElementNS(SVG_NS, 'textPath');
          tp.setAttribute('href', `#${ARC_PATH_ID}`);
          tp.setAttribute('startOffset', '50%');
          const chars = [...layer.text];
          chars.forEach((ch, i) => {
            const ts = document.createElementNS(SVG_NS, 'tspan');
            ts.textContent = ch;
            ts.setAttribute('fill', rainbowHsl(i, chars.length));
            tp.appendChild(ts);
          });
          textEl.removeAttribute('fill');
          textEl.appendChild(tp);
        } else {
          const tp = document.createElementNS(SVG_NS, 'textPath');
          tp.setAttribute('href', `#${ARC_PATH_ID}`);
          tp.setAttribute('startOffset', '50%');
          tp.textContent = layer.text;
          textEl.appendChild(tp);
          // Apply fill to text element
          applyFill(color);
          requestAnimationFrame(() => positionGradient(color));
        }
      } else {
        // Straight text — position via x/y
        textEl.setAttribute('x', String(layer.x));
        textEl.setAttribute('y', String(layer.y));
        textEl.setAttribute('dominant-baseline', 'central');

        if (isRainbow) {
          const chars = [...layer.text];
          chars.forEach((ch, i) => {
            const ts = document.createElementNS(SVG_NS, 'tspan');
            ts.textContent = ch;
            ts.setAttribute('fill', rainbowHsl(i, chars.length));
            textEl.appendChild(ts);
          });
          textEl.removeAttribute('fill');
        } else {
          textEl.textContent = layer.text;
          applyFill(color);
          requestAnimationFrame(() => positionGradient(color));
        }
      }
    }

    function applyFill(color: PaletteColor): void {
      if (color.kind === 'solid') {
        textEl.setAttribute('fill', color.hex);
      } else if (color.kind === 'linear-gradient' || color.kind === 'radial-gradient') {
        gradientEl = buildGradient(color);
        defs.appendChild(gradientEl);
        textEl.setAttribute('fill', `url(#${GRADIENT_ID})`);
      } else {
        textEl.setAttribute('fill', '#ffffff');
      }
    }

    // Initial position
    const initialLayer = getTextLayer();
    if (initialLayer.x === 0 && initialLayer.y === 0) {
      const paper = PAPER_SIZES[getPaperSizeIndex()];
      const pW = paper.widthIn * UNITS_PER_INCH;
      const pH = paper.heightIn * UNITS_PER_INCH;
      updateTextLayer({
        x: (viewBoxW - pW) / 2 + pW / 2,
        y: viewBoxH * 0.15 + pH / 2,
      });
    }

    const currentLayer = getTextLayer();
    applyLayer(currentLayer);
    requestAnimationFrame(() => repositionHandles(getTextLayer()));

    setupDrag(
      svg,
      textEl,
      () => ({ x: getTextLayer().x, y: getTextLayer().y }),
      (x, y) => updateTextLayer({ x, y }),
    );

    setupResizeHandle(
      svg,
      resizeHandle,
      () => getTextLayer().sizeIn,
      (sizeIn) => updateTextLayer({ sizeIn }),
    );

    setupRotationHandle(
      svg,
      rotHandle,
      () => ({ x: getTextLayer().x, y: getTextLayer().y }),
      () => getTextLayer().rotation,
      (rotation) => updateTextLayer({ rotation }),
    );

    unsubscribeLayer = onLayerChange((updated) => {
      applyLayer(updated);
      requestAnimationFrame(() => {
        repositionHandles(updated);
        positionGradient(updated.color);
      });
    });
  };

  probe.src = import.meta.env.BASE_URL + garment.image;
}
