import type { PaletteColor } from './types';
import { SOLIDS } from './solids';
import { GRADIENTS } from './gradients';

export const PALETTE: PaletteColor[] = [...SOLIDS, ...GRADIENTS];
export type { PaletteColor } from './types';
