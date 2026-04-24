export type FontCategory =
  | 'varsity'
  | 'playful'
  | 'script'
  | 'retro'
  | 'soft'
  | 'bold-display'
  | 'vintage-serif';

export type Font = {
  id: string;
  family: string;
  displayName: string;
  source: 'local' | 'google';
  file?: string;
  category: FontCategory;
  hasBold: boolean;
  hasItalic: boolean;
};
