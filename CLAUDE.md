# CLAUDE.md

This file is the durable project brief for Claude Code. Read it at the start of every session. The README.md covers the user-facing narrative; this file covers the rules you work under.

## Project summary

`printable` is a static browser-based design tool for iron-on transfers. A user designs text directly on a photo of a real garment, sees it at real physical inches, and exports a 300 DPI PNG calibrated for their printer. It's a personal playground, not a production product. TypeScript + Vite, deployed to GitHub Pages. No backend.

For the full narrative, user stories, and visual context, read README.md.

## The three load-bearing ideas

Every design and code decision traces back to one of these. If a change would violate one of them, stop and ask before proceeding.

1. **The garment is the canvas.** The design surface is always a photo of a real garment with a dashed safe-print rectangle overlaid. The sheet of paper is not a design surface; it's a print-time output setting.
2. **Inches are the unit.** Font size, text position, safe-area dimensions — all in real inches on the real garment. Not pixels, not SVG units (internally SVG units are used as 100-per-inch, but they never surface in UI).
3. **The paper is a print-time concern.** Paper size appears only in the export dialog. The user never picks a paper size while designing.

## Data models (authoritative)

These types are the spine of the app. If you touch them, update this section and the README together.

```ts
// src/data/garments/types.ts
export type GarmentType = 'tank' | 'dress' | 'tee';

export type Garment = {
  id: string;                   // 'primary-slub-tank-poppy-2'
  label: string;                // display name
  brand: string;                // key into BRAND_CHARTS
  size: string;                 // key into the brand's sizes map
  type: GarmentType;
  colorway: { name: string; hex: string };
  image: string;                // path relative to public/mockups/
};

export type SizeRecord = {
  chestWidthIn: number;
  bodyLengthIn: number;
  printAreaWidthIn: number;
  printAreaHeightIn: number;
  skirtLengthIn?: number;       // dresses only
};
```

```ts
// src/data/fonts/types.ts
export type FontCategory =
  | 'varsity' | 'playful' | 'script' | 'retro'
  | 'soft' | 'bold-display' | 'vintage-serif';

export type Font = {
  id: string;
  family: string;               // exact CSS font-family string
  displayName: string;
  source: 'local' | 'google';
  file?: string;                // local fonts only, path under public/fonts/
  category: FontCategory;
  hasBold: boolean;
  hasItalic: boolean;
};
```

```ts
// src/data/palette/types.ts
export type PaletteColor =
  | { kind: 'solid'; hex: string; name: string }
  | { kind: 'linear-gradient'; stops: { offset: number; hex: string }[]; angle: number; name: string }
  | { kind: 'radial-gradient'; stops: { offset: number; hex: string }[]; name: string }
  | { kind: 'per-letter' };
```

The color picker iterates one array of `PaletteColor`. The renderer switches on `kind`. The user never picks "gradient mode" — gradients are just colors.

## Seeded garments

Three presets, populated into `src/data/garments/index.ts`:

- `primary-slub-tank-poppy-2` — Primary Kids Slub Pocket Tank, size 2, Poppy colorway (red)
- `primary-tank-dress-fuchsia-5` — Primary Kids Tank Dress, size 5, Fuchsia colorway (magenta)
- `primary-tank-dress-banana-5` — Primary Kids Tank Dress, size 5, Banana colorway (yellow)

All three are Primary brand. All three have product photos in `public/mockups/` keyed by id. Size-chart values come from `BRAND_CHARTS.primary` and are approximate (Primary does not publish garment measurements) — calibration overrides them at runtime.

### Known quirk: the Poppy tank photo / size mismatch

The product photo for `primary-slub-tank-poppy-2` is a size-5 sample (the neck tag is visible in the image), but the preset is defined as size 2 because that's the intended design reference. The user doesn't own the physical size-2 tank, so calibration on this preset is an eyeballed exercise on a larger-than-actual photo.

**This is intentional.** Do not:
- Change the preset's size to 5 to match the photo.
- Swap the photo for a different size.
- Add warning UI about the mismatch.
- Treat this as a bug to fix during milestones.

The practical consequence: rendered text on this preset will appear proportionally smaller than the same inch-measurement would on a real size-2 tank. Acceptable for a personal playground.

## Calibration (critical UX rule)

Primary doesn't publish garment measurements, so seeded size-chart values are approximations. **Calibration by two user clicks is not optional** — it's the mechanism that makes real-inches-on-real-garment actually work.

- First use of a seeded preset triggers a modal over the photo.
- Prompt text is garment-type-aware. **Do not use a generic fallback.** The three prompts:
  - Tank: "Click the left and right edges of the chest, just below the armholes."
  - Dress: "Click the left and right edges of the bodice at its widest point."
  - Tee: "Click shoulder seam to shoulder seam."
- The two clicks establish pixels-per-inch for that photo. Cache in `localStorage` keyed by garment id, scoped to the browser.
- Do not use `shoulderWidthIn` from the size chart for anything. v1 did this and it was wrong for tanks and dresses.
- Users may be eyeballing the clicks on a photo of a different-size garment (see the Poppy tank quirk above). The math still works; the result is just less accurate. Don't special-case this.

## Deferred features (do not build in MVP)

If a milestone prompt would have you build these, stop and confirm:

- Per-letter color
- Outline, drop shadow, curve/arc, sparkles effects
- Multi-layer design (more than one text block)
- Rotation handle
- Tight-crop export
- SVG export
- Font upload drop zone
- Font favorites
- Calibration override by typed tape measurement
- Garments beyond the seeded three
- Back-of-garment design

All of these slot into the MVP data models without restructuring, so deferring them is safe.

## Render pipeline rules

- 100 SVG units per inch. This is the internal unit. Never surface it to the user.
- The design view is a single `<svg>` with the garment photo as an `<image>` backdrop. The viewBox uses the garment's calibrated inches.
- Text layers are `<g>` elements positioned in real-inch coordinates.
- Safe print area is a `<rect>` with `stroke-dasharray`, sized from the garment's size-chart record scaled by the calibration ratio.
- PNG export constructs a separate paper-sized SVG (text layers only, no garment photo, transparent background), then rasterizes via an offscreen `<canvas>` at 300 DPI.

## Build and test discipline

- Run `npm run build` before claiming any task is done. If it fails, fix it or tell me.
- Run `npm run dev` and verify the behavior you implemented actually works in the browser before saying it's done. Don't rely on "it compiles."
- When behavior involves real-inch math (calibration, font sizes, safe areas), verify with two data points, not one. Catches unit confusion.
- On mobile behavior (touch drag, pinch zoom): verify with the Chrome DevTools mobile emulator at iPhone dimensions. Don't assume.

## Code style

- TypeScript strict mode on. No `any`. If you reach for `any`, stop and ask.
- No React, no frameworks beyond Vite itself. Vanilla TS modules.
- One concern per file. If a file grows past ~300 lines, split.
- Data and state live in `src/data/` and `src/state/`. UI components live in `src/ui/`. Canvas rendering lives in `src/canvas/`. Don't cross these.
- Exported names are `PascalCase` for types, `camelCase` for functions and values.
- No comments that narrate what the code does. Comments explain why, not what.

## Milestone structure

Work in the milestones defined in README.md. Between milestones, stop and let the user review. Do not chain milestones.

Current milestone status: *not yet started*.

1. Scaffolding + empty module files + GitHub Pages deploy + "hello printable" page
2. Data models populated (three garments, fonts manifest, palette)
3. Canvas + calibration flow + safe-area rectangle rendering
4. One text layer: font, size-in-inches, solid color, drag, resize
5. Export dialog: paper size, mirror, oversize warning, 300 DPI PNG
6. Polish: gradients, Google Fonts lazy loading, localStorage library, mobile responsiveness, deploy check

## Review commands

Before committing a milestone, invoke these in this order:

- `/code-reviewer` — catches bugs, type misuse, dead code
- `/spec-reviewer` — verifies alignment with README.md and this file
- `/ux-reviewer` — walks the user flow and flags friction

Reviewers must not fix their own findings. Reviewers write reports. Fixes happen in a separate pass.

## Hard rules

- Never add a feature not in the current milestone without asking.
- Never invent a data structure. The ones defined here are canonical.
- Never fall back to shoulder-width calibration. v1 did this and it was wrong.
- Never use synthetic bold or italic. If the font has no bold weight, the Bold button greys out.
- Never let paper-size thinking leak into the design view. Paper appears only at export.
- Never surface SVG units or pixel coordinates in the UI. Real inches only.
- Never persist user-uploaded fonts beyond the session. Per-design only.
- Never "correct" the Poppy tank size / photo mismatch. See the Known Quirk section.
- If a decision would violate any of the above, stop and ask. Asking is always better than guessing.

## When in doubt

Re-read the three load-bearing ideas at the top of this file. If the answer still isn't clear, ask the user. This is a personal playground, not a race — clarifying questions are cheap, mid-milestone rewrites are expensive.
