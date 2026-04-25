import type { PaletteColor } from './types';
import { SOLIDS } from './solids';
import { GRADIENTS } from './gradients';

export const RAINBOW: PaletteColor = { kind: 'per-letter', name: 'Rainbow' };

export const PALETTE: PaletteColor[] = [...SOLIDS, ...GRADIENTS, RAINBOW];
export type { PaletteColor } from './types';
