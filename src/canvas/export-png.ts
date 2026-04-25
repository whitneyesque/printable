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

function drawText(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  layer: TextLayer,
  sizePx: number,
  mirror: boolean,
): void {
  ctx.font = fontString(layer, sizePx);
  const metrics = ctx.measureText(layer.text);
  const textW = metrics.width;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  ctx.save();

  // Mirror flips horizontally around center
  if (mirror) {
    ctx.translate(canvasW, 0);
    ctx.scale(-1, 1);
  }

  // Rotation around the text center point
  if (layer.rotation !== 0) {
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Outline drawn first so fill sits on top
  if (layer.outlineWidth > 0) {
    const outlinePx = layer.outlineWidth * (sizePx / layer.sizeIn);
    ctx.strokeStyle = layer.outlineColor;
    ctx.lineWidth = outlinePx;
    ctx.lineJoin = 'round';
    ctx.strokeText(layer.text, cx, cy);
  }

  ctx.fillStyle = canvasFill(ctx, layer.color, cx, cy, textW, sizePx);
  ctx.fillText(layer.text, cx, cy);

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
