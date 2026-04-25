import type { Font } from './types';
import { LOCAL_FONTS } from './local';
import { GOOGLE_FONTS } from './google';

export const FONTS: Font[] = [...LOCAL_FONTS, ...GOOGLE_FONTS];
export type { Font, FontCategory } from './types';
