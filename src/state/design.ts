import { GARMENTS } from '../data/garments/index';
import { FONTS } from '../data/fonts/index';
import { SOLIDS } from '../data/palette/solids';
import type { Garment } from '../data/garments/types';
import type { PaletteColor } from '../data/palette/types';

export type TextLayer = {
  text: string;
  fontId: string;
  sizeIn: number;
  bold: boolean;
  italic: boolean;
  color: PaletteColor;
  outlineWidth: number;  // inches, 0 = no outline
  outlineColor: string;  // hex
  rotation: number;      // degrees
  curve: number;         // arc radius in inches, 0 = straight, + = arch up, - = arch down
  x: number;
  y: number;
};

type GarmentHandler = (g: Garment) => void;
type LayerHandler = (l: TextLayer) => void;
type PaperHandler = (index: number) => void;

const LAYER_KEY = 'printable:layer';

function saveLayer(l: TextLayer): void {
  try {
    // x and y are garment-specific — restore fresh each session
    const { x: _x, y: _y, ...rest } = l;
    localStorage.setItem(LAYER_KEY, JSON.stringify(rest));
  } catch {
    // ignore storage errors (private browsing, quota, etc.)
  }
}

function loadSavedLayer(): Partial<TextLayer> {
  try {
    const raw = localStorage.getItem(LAYER_KEY);
    return raw ? (JSON.parse(raw) as Partial<TextLayer>) : {};
  } catch {
    return {};
  }
}

let currentGarmentId: string = GARMENTS[0].id;
let paperSizeIndex = 1; // Letter landscape — contains the safe zone for all seeded garments
let layer: TextLayer = {
  text: 'Your text',
  fontId: FONTS[0].id,
  sizeIn: 1.5,
  bold: false,
  italic: false,
  color: SOLIDS[0],
  outlineWidth: 0,
  outlineColor: '#000000',
  rotation: 0,
  curve: 0,
  x: 0,
  y: 0,
  ...loadSavedLayer(),
};

const garmentHandlers: GarmentHandler[] = [];
const layerHandlers: LayerHandler[] = [];
const paperHandlers: PaperHandler[] = [];

function makeUnsub<T>(arr: T[], item: T): () => void {
  return () => {
    const i = arr.indexOf(item);
    if (i !== -1) arr.splice(i, 1);
  };
}

export function getCurrentGarment(): Garment {
  const g = GARMENTS.find((item) => item.id === currentGarmentId);
  if (!g) throw new Error(`Garment not found: ${currentGarmentId}`);
  return g;
}

export function setCurrentGarment(id: string): void {
  currentGarmentId = id;
  layer = { ...layer, x: 0, y: 0 };
  garmentHandlers.forEach((h) => h(getCurrentGarment()));
}

export function onGarmentChange(handler: GarmentHandler): () => void {
  garmentHandlers.push(handler);
  return makeUnsub(garmentHandlers, handler);
}

export function getTextLayer(): TextLayer {
  return { ...layer };
}

export function updateTextLayer(patch: Partial<TextLayer>): void {
  layer = { ...layer, ...patch };
  saveLayer(layer);
  const snapshot = { ...layer };
  layerHandlers.forEach((h) => h(snapshot));
}

export function onLayerChange(handler: LayerHandler): () => void {
  layerHandlers.push(handler);
  return makeUnsub(layerHandlers, handler);
}

export function getPaperSizeIndex(): number {
  return paperSizeIndex;
}

export function setPaperSizeIndex(index: number): void {
  paperSizeIndex = index;
  paperHandlers.forEach((h) => h(index));
}

export function onPaperSizeChange(handler: PaperHandler): () => void {
  paperHandlers.push(handler);
  return makeUnsub(paperHandlers, handler);
}
