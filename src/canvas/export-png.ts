import type { TextLayer } from '../state/design';
import type { PaletteColor } from '../data/palette/types';
import { FONTS } from '../data/fonts/index';

const DPI = 300;

export type PaperSize = {
  label: string;
  widthIn: number;
  heightIn: number;
};

export const PAPER_SIZES: PaperSize[] = [
  { label: 'Letter portrait (8.5 × 11")', widthIn: 8.5, heightIn: 11 },
  { label: 'Letter landscape (11 × 8.5")', widthIn: 11, heightIn: 8.5 },
  { label: 'A4 portrait (8.27 × 11.69")', widthIn: 8.27, heightIn: 11.69 },
  { label: 'A4 landscape (11.69 × 8.27")', widthIn: 11.69, heightIn: 8.27 },
];

function fontString(layer: TextLayer, sizePx: number): string {
  const font = FONTS.find((f) => f.id === layer.fontId) ?? FONTS[0];
  const style = layer.italic && font.hasItalic ? 'italic' : '';
  const weight = layer.bold && font.hasBold ? 'bold' : 'normal';
  const parts = [style, weight, `${sizePx}px '${font.family}', sans-serif`].filter((p) => p !== '');
  return parts.join(' ');
}

function rainbowHsl(i: number, total: number): string {
  return `hsl(${Math.round((i / Math.max(total - 1, 1)) * 300)}, 100%, 50%)`;
}

export function isOversized(layer: TextLayer, paper: PaperSize): boolean {
  if (layer.sizeIn >= paper.heightIn) return true;
  const sizePx = layer.sizeIn * DPI;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = fontString(layer, sizePx);
  const measuredIn = ctx.measureText(layer.text).width / DPI;
  return measuredIn > paper.widthIn;
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const tile = 14;
  for (let y = 0; y < h; y += tile) {
    for (let x = 0; x < w; x += tile) {
      ctx.fillStyle = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0 ? '#cccccc' : '#ffffff';
      ctx.fillRect(x, y, tile, tile);
    }
  }
}

function canvasFill(
  ctx: CanvasRenderingContext2D,
  color: PaletteColor,
  cx: number,
  cy: number,
  textW: number,
  textH: number,
): string | CanvasGradient {
  if (color.kind === 'solid') return color.hex;

  if (color.kind === 'linear-gradient') {
    const rad = (color.angle * Math.PI) / 180;
    const dx = Math.sin(rad) * (textW / 2);
    const dy = -Math.cos(rad) * (textH / 2);
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    color.stops.forEach((s) => grad.addColorStop(s.offset, s.hex));
    return grad;
  }

  if (color.kind === 'radial-gradient') {
    const r = Math.max(textW, textH) / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    color.stops.forEach((s) => grad.addColorStop(s.offset, s.hex));
    return grad;
  }

  return '#ffffff';
}

function applyOutline(ctx: CanvasRenderingContext2D, layer: TextLayer, sizePx: number): void {
  if (layer.outlineWidth <= 0) return;
  // Scale outline proportionally with font size
  ctx.strokeStyle = layer.outlineColor;
  ctx.lineWidth = layer.outlineWidth * sizePx / layer.sizeIn;
  ctx.lineJoin = 'round';
}

// Straight text: uniform color or gradient, with optional rotation and outline
function drawStraightText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  sizePx: number,
  cx: number,
  cy: number,
): void {
  const metrics = ctx.measureText(layer.text);
  const textW = metrics.width;

  if (layer.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (layer.outlineWidth > 0) {
    applyOutline(ctx, layer, sizePx);
    ctx.strokeText(layer.text, cx, cy);
  }
  ctx.fillStyle = canvasFill(ctx, layer.color, cx, cy, textW, sizePx);
  ctx.fillText(layer.text, cx, cy);
}

// Straight text, per-letter rainbow
function drawRainbowStraight(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  sizePx: number,
  cx: number,
  cy: number,
): void {
  const chars = [...layer.text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0);

  ctx.textAlign = 'left';
  let x = cx - totalW / 2;

  if (layer.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  chars.forEach((ch, i) => {
    if (layer.outlineWidth > 0) {
      applyOutline(ctx, layer, sizePx);
      ctx.strokeText(ch, x, cy);
    }
    ctx.fillStyle = rainbowHsl(i, chars.length);
    ctx.fillText(ch, x, cy);
    x += widths[i];
  });
}

// Curved text: character-by-character arc placement
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  sizePx: number,
  cx: number,
  cy: number,
): void {
  const R = Math.abs(layer.curve) * (sizePx / layer.sizeIn); // R in pixels
  const isUp = layer.curve > 0;
  const chars = [...layer.text];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const totalW = widths.reduce((a, b) => a + b, 0);

  let xCursor = -totalW / 2;

  chars.forEach((ch, i) => {
    const charW = widths[i];
    const charMid = xCursor + charW / 2;
    const angle = charMid / R; // arc angle from center (radians)

    let charX: number, charY: number, charRot: number;
    if (isUp) {
      // Circle center at (cx, cy + R) — arc goes over the top
      charX = cx + R * Math.sin(angle);
      charY = cy + R - R * Math.cos(angle);
      charRot = angle;
    } else {
      // Circle center at (cx, cy - R) — arc goes under the bottom
      charX = cx + R * Math.sin(angle);
      charY = cy - R + R * Math.cos(angle);
      charRot = -angle;
    }

    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(charRot);

    if (layer.outlineWidth > 0) {
      applyOutline(ctx, layer, sizePx);
      ctx.strokeText(ch, 0, 0);
    }

    if (layer.color.kind === 'per-letter') {
      ctx.fillStyle = rainbowHsl(i, chars.length);
    } else {
      // Solid fill per char; gradients approximate to solid center color
      const fill = canvasFill(ctx, layer.color, 0, 0, charW, sizePx);
      ctx.fillStyle = typeof fill === 'string' ? fill : '#ffffff';
    }
    ctx.fillText(ch, 0, 0);

    ctx.restore();
    xCursor += charW;
  });
}

function drawText(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  layer: TextLayer,
  sizePx: number,
  mirror: boolean,
): void {
  ctx.font = fontString(layer, sizePx);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  ctx.save();
  if (mirror) {
    ctx.translate(canvasW, 0);
    ctx.scale(-1, 1);
  }

  if (layer.curve !== 0) {
    drawCurvedText(ctx, layer, sizePx, cx, cy);
  } else if (layer.color.kind === 'per-letter') {
    drawRainbowStraight(ctx, layer, sizePx, cx, cy);
  } else {
    drawStraightText(ctx, layer, sizePx, cx, cy);
  }

  ctx.restore();
}

// Renders a scaled-down checkerboard preview into the given canvas element.
export async function renderPreview(
  canvas: HTMLCanvasElement,
  layer: TextLayer,
  paper: PaperSize,
  mirror: boolean,
): Promise<void> {
  await document.fonts.ready;

  // Fit within 400×280 while preserving paper aspect ratio
  const maxW = 400;
  const maxH = 280;
  const aspect = paper.heightIn / paper.widthIn;
  let w = maxW;
  let h = Math.round(maxW * aspect);
  if (h > maxH) {
    h = maxH;
    w = Math.round(maxH / aspect);
  }

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  drawCheckerboard(ctx, w, h);

  // Scale font size proportionally from 300 DPI full-res down to preview size
  const sizePx = layer.sizeIn * DPI * (w / (paper.widthIn * DPI));
  drawText(ctx, w, h, layer, sizePx, mirror);
}

export async function exportPng(
  layer: TextLayer,
  paper: PaperSize,
  mirror: boolean,
): Promise<void> {
  await document.fonts.ready;

  const canvasW = Math.round(paper.widthIn * DPI);
  const canvasH = Math.round(paper.heightIn * DPI);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  drawText(ctx, canvasW, canvasH, layer, layer.sizeIn * DPI, mirror);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'printable-transfer.png';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
