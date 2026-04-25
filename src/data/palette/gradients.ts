import type { PaletteColor } from './types';

export const GRADIENTS: PaletteColor[] = [
  {
    kind: 'linear-gradient',
    name: 'Sunset',
    angle: 90,
    stops: [
      { offset: 0, hex: '#FF6B6B' },
      { offset: 0.5, hex: '#FFD93D' },
      { offset: 1, hex: '#FF6B6B' },
    ],
  },
  {
    kind: 'linear-gradient',
    name: 'Ocean',
    angle: 90,
    stops: [
      { offset: 0, hex: '#2196F3' },
      { offset: 1, hex: '#00BCD4' },
    ],
  },
  {
    kind: 'linear-gradient',
    name: 'Cotton Candy',
    angle: 135,
    stops: [
      { offset: 0, hex: '#FF69B4' },
      { offset: 1, hex: '#B39DDB' },
    ],
  },
  {
    kind: 'radial-gradient',
    name: 'Gold',
    stops: [
      { offset: 0, hex: '#FFF176' },
      { offset: 1, hex: '#F9A825' },
    ],
  },
];
