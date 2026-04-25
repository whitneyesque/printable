import type { SizeRecord } from './garments/types';

type BrandChart = Record<string, SizeRecord>;

export const BRAND_CHARTS: Record<string, BrandChart> = {
  primary: {
    '2': {
      chestWidthIn: 10.5,
      bodyLengthIn: 14,
      printAreaWidthIn: 9,
      printAreaHeightIn: 6.5,
    },
    '5': {
      chestWidthIn: 12.5,
      bodyLengthIn: 25,
      printAreaWidthIn: 11,
      printAreaHeightIn: 8,
      skirtLengthIn: 14,
    },
  },
};
