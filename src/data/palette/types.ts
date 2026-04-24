export type PaletteColor =
  | { kind: 'solid'; hex: string; name: string }
  | {
      kind: 'linear-gradient';
      stops: { offset: number; hex: string }[];
      angle: number;
      name: string;
    }
  | {
      kind: 'radial-gradient';
      stops: { offset: number; hex: string }[];
      name: string;
    }
  | { kind: 'per-letter' };
