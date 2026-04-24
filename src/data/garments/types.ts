export type GarmentType = 'tank' | 'dress' | 'tee';

export type Garment = {
  id: string;
  label: string;
  brand: string;
  size: string;
  type: GarmentType;
  colorway: { name: string; hex: string };
  image: string;
};

export type SizeRecord = {
  chestWidthIn: number;
  bodyLengthIn: number;
  printAreaWidthIn: number;
  printAreaHeightIn: number;
  skirtLengthIn?: number;
};
