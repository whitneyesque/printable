# printable

A browser-based design tool for making custom iron-on transfers, the kind you print on transfer paper and iron onto a T-shirt, tank, or dress.

Personal playground. Successor to [`iron-on`](https://whitneyesque.github.io/whitneymasulis.github.io/iron-on/).

Live: *TBD, deployed via GitHub Pages*

---

## The core promise

**Design on the garment. Print at the right size. Done.**

Most DIY iron-on projects fail for one of two reasons: the design looks wrong on the shirt because you designed it abstractly and guessed the scale, or the print comes out at 75% because the print dialog quietly rescaled it.

`printable` fixes both.

You design directly on a photo of your actual garment. A size-5 tank dress in Fuchsia. A size-2 slub pocket tank in Poppy. You type `Brooklyn` and you see how it'll really look, at real inches, on the real shirt. No abstract canvas, no guessing at scale.

When you export, the tool works out what PNG needs to come out of your printer to make that design happen. The PNG is exactly US Letter (8.5 × 11") at 300 DPI, already mirrored for light-fabric transfer paper, and centered. You open it on your phone or computer, hit **Print**, and the printer runs it at 100%. No scaling dialog, no PDF intermediary.

The PNG dimensions are calibrated for exactly this:

| Paper setting              | Output dimensions         |
| -------------------------- | ------------------------- |
| US Letter portrait, 300 DPI  | 2550 × 3300 px            |
| US Letter landscape, 300 DPI | 3300 × 2550 px            |
| Square 8 × 8", 300 DPI       | 2400 × 2400 px            |
| Portrait 8 × 10", 300 DPI    | 2400 × 3000 px            |
| Tight crop to design       | Whatever fits, at 300 DPI |

Background is transparent. Only the ink prints, which is the correct behavior for iron-on paper.

## The mental model

Three ideas, in order:

1. **The garment is the canvas.** When the app opens, you're looking at a photo of your actual shirt, with a dashed rectangle showing its safe print area. The dashed rectangle is the designable region. Text placed inside it is text that'll fit on the shirt. Text placed outside gets a warning.

2. **Inches are the unit.** The font size control reads in real inches. A 3-inch letter is 3 inches tall on the actual garment. If you set `Brooklyn` to height 2.5", you know exactly how tall it'll be when ironed.

3. **The paper is a print-time concern.** You never pick a paper size while designing. At export, the tool asks: "I'll send this to US Letter at 300 DPI, mirrored for light fabric. OK?" If the design is too big for a sheet, you get a warning and a resize suggestion before any PNG gets generated.

Put differently: v1 of this tool put a sheet of paper in front of you and asked you to imagine the shirt. v2 puts the shirt in front of you and handles the paper in the background.

## What's different from v1

v1 (`iron-on`) was vanilla JS with no build step and an impressive feature list: ~80 Google Fonts + ~45 local, per-letter coloring, sparkles filter, photo calibration. It worked, but the interaction model started on the paper and added the garment as an afterthought preview. A few things earned a rewrite:

- **Mockup-first is the whole point now.** Design lives on the garment photo from the first click. The sheet of paper never appears as a design surface; it's a print configuration setting.
- **Calibration is a first-class first step.** Primary doesn't publish garment measurements, so the seeded dimensions in `size-charts.ts` are approximations. Before the user does anything else with a new garment, they calibrate it with two clicks on the photo. Clicks are cached forever, so this is a one-time cost per garment.
- **Calibration lands where the garment actually has a landmark.** v1 asked for shoulder-to-shoulder clicks. Tanks don't have shoulder seams. v2 calibrates on chest width, with garment-specific prompt text (tanks, dresses, and tees each get their own landmark instructions).
- **Color is a first-class data type.** Solid, gradient, per-letter, and rainbow all live in the same picker as the same kind of object. The user never picks "gradient mode"; gradients are just colors that happen to be gradients.
- **The font library is curated, not dumped.** v1's 125+ faces were a scroll marathon. v2 is ~75 faces in seven categories with live previews.
- **TypeScript, Vite, and a proper deploy workflow.** The three interlocking data domains (garments, fonts, colors) need types to stay honest. Vite gives fast dev loops and small static bundles.
- **A `CLAUDE.md` alongside the README.** For a Claude Code project, the brief the agent uses matters as much as the human-facing README.

Everything that worked in v1 carries forward: 300 DPI PNG export, mirroring toggle, SVG-based rendering at 100 units per inch, localStorage library, FontFace API for user-uploaded fonts, Canon inkjet + light-fabric paper as the reference printing target.

## Works on mobile iOS Chrome and Safari

The whole app runs on an iPhone or iPad in Chrome or Safari. On purpose:

- Most craft design happens on a phone on the couch, not at a desk.
- Iron-on printing typically happens via AirPrint, which starts from the iPhone Photos or Files app.
- Mobile Chrome is the bridge between a design idea and a printed transfer sheet.

What works on mobile:

- **Touch-drag** on the garment to move a text layer.
- **Pinch-zoom** to get in close on detail work.
- Font drop zone supports the iOS file picker (tap → Choose File → Photo Library / iCloud).
- Export downloads straight to Photos or Files, then **Share → Print** passes the exact pixel dimensions to AirPrint at 100% scale.
- Layout reflows on narrow screens.

---

## The design workflow

### First-run: pick and calibrate a garment

On first use, or any time you pick a new seeded preset, the app opens a calibration dialog over the product photo.

The prompt is garment-type-aware:

- **Tank**: "Click the left and right edges of the chest, just below the armholes."
- **Dress**: "Click the left and right edges of the bodice at its widest point."
- **Tee**: "Click shoulder seam to shoulder seam."

Why chest width and not shoulder-to-shoulder? Tanks don't have shoulder seams. The v1 prompt asked users to find a landmark that doesn't exist on two of the three seeded garments. Chest width is the measurement the size chart tracks (`chestWidthIn`), so the math stays honest.

Once calibrated, the app knows the photo's pixels-per-inch ratio. Everything else is derived from that: safe print area dimensions, font size in real inches, text layer position. Calibration caches per preset per browser, so pick the same garment again and the dialog is skipped.

For dresses, the safe print area is constrained to the **bodice above the waist seam**. Text can't cross the seam without wrinkling when ironed, so the dashed print zone stops at the seam instead of spilling into the skirt.

### The design view

After calibration, the design view opens on the garment photo. A dashed red rectangle shows the safe print area. You add text directly onto the garment.

**Per-layer typography.** Font family, size (in real inches), letter spacing, line height, rotation. Content is editable multi-line text.

**Four color modes**, all in one picker:

- **Solid.** One color across the whole word.
- **Gradient.** Custom linear gradient, any angle, as many stops as you want.
- **Rainbow presets.** Three seven-stop ROYGBIV presets at any angle, each with a different mood: *saturated crayon*, *soft pastel*, *warm sunset*. Picked straight from the kid coloring-app screenshots that seeded this project.
- **Per-letter.** Every letter can be its own color (rainbow names).

**Four stackable effects:**

- **Outline** with configurable color and width.
- **Drop shadow / glow** with color, blur, X/Y offset.
- **Curve / arc** that bends the text along a quadratic curve (smile or frown).
- **Sparkles** as a procedural star field around the text, with seeded randomness so it stays stable as you tweak.

**Layer operations.** Drag to reorder, duplicate, delete. New layers spawn at the garment's center (inside the safe print area). `Ctrl/Cmd+D` duplicates the selected layer.

**Keyboard shortcuts:**

- `Ctrl/Cmd+S` saves the current design to the library.
- `Ctrl/Cmd+D` duplicates the selected layer.
- Arrow keys nudge the selected layer; Shift+arrow nudges in bigger steps.

**Safe-area warning.** When any text extends past the dashed rectangle, a yellow banner appears at the top of the canvas ("Text is outside the safe print area — it may be cut off"). The warning is advisory, not blocking. Users can design freely; the banner just tells them what's happening.

**Switching garments.** A preset dropdown at the top of the canvas swaps the garment. Design persists where possible: text layers stay in the same relative position, font sizes stay in real inches. If the new garment's safe area is smaller, the warning appears on any layers that now fall outside.

### Export

Export doesn't care what the user was designing. It asks three questions:

1. **Paper size.** US Letter (default) / Square 8 × 8" / Portrait 8 × 10" / Landscape.
2. **Mirror?** Checked by default for light-fabric transfer paper. Unchecked for dark-fabric paper.
3. **Crop.** US Letter centered (default) or tight crop to design.

If the design is **too big for the chosen paper** — rare, because the garment's safe print area is usually smaller than US Letter anyway, but possible on larger kid sizes or adult garments — the dialog blocks export and surfaces a warning: "Design is 9.2" wide but US Letter fits 8.0" between margins. Resize the design or choose a larger paper."

If the design fits, export produces a transparent PNG at 300 DPI, already mirrored, centered on the sheet, downloaded to Photos or Files.

---

## Seeded garments

Three garments, ready to use:

- **Primary Kids Slub Pocket Tank** — size 2, Poppy colorway
- **Primary Kids Tank Dress** — size 5, Fuchsia colorway
- **Primary Kids Tank Dress** — size 5, Banana colorway

Each has a real product photo in `public/mockups/` and an approximate size record in `src/data/size-charts.ts`. Calibration overrides the approximation with the real garment's chest width.

**Known quirk for the Poppy tank.** The product photo used for this preset happens to be a size-5 sample, but the preset is defined as size 2 because that's the intended reference. Users calibrating this garment are eyeballing chest-width clicks on a larger photo than the size they're "designing for," so rendered text will appear slightly smaller than expected on the photo compared to how the same text would look on a real size-2 tank. This is intentional and documented — do not try to "correct" the mismatch by swapping the size or the photo.

Adding a fourth is a few lines of data (see *Adding content* below).

---

## Fonts

A serious font library, organized into seven categories with live previews in the picker.

**~45 bundled local fonts** shipped in `public/fonts/` as TTF/OTF files, playful display faces suited to apparel decoration:

- **Varsity / collegiate:** Blockton Varsity, Collegiate Heavy Outline, Old Sport 01, Old Sport 02, Sporting Outline
- **Playful / childlike:** Balonku, Colgan, Daisy Script, Fluffy Blitz, Gasley, Hyperblob (regular / outline / bold), Momcake (regular / bold), Playgum (two weights), Procrastinating Pixie, Shiny Unicorn (display and personal-use), Smilen, Spooky Pixels (three weights), Spooky Bat, Spooky Monsta, Spooky Theme, Spooky Webbie, Unicorn Balloon
- **Script / handwritten:** Cake Nom, Kortz (two weights), Softcakes, Spicy Sale (two weights)
- **Retro / Y2K:** Aquire (bold / light), Gas Huffer Phat, Hooverville, Pwyummydonuts, Street Explorer, Third Street (regular / bold)
- **Soft / round:** Glowtone, Ghang (two weights), Backtrack
- **Bold display:** Hyper Blob ZVJ6I

**~30 curated Google Fonts** to round out categories with reliable, well-hinted web faces. Fetched lazily when a category is expanded, so cold load stays fast:

- **Varsity:** Bungee, Bungee Shade, Alfa Slab One
- **Script / handwritten:** Caveat, Shadows Into Light, Permanent Marker, Homemade Apple, Kalam, Dancing Script, Pacifico, Sacramento, Allura, Great Vibes
- **Soft / round:** Fredoka, Nunito, Bubblegum Sans, Baloo 2
- **Playful:** Lilita One, Luckiest Guy, Fugaz One, Patrick Hand, Gloria Hallelujah
- **Retro / Y2K:** Monoton, Faster One, Bungee Outline, Rubik Glitches, Rubik Bubbles
- **Bold display:** Black Ops One, Fjalla One, Bowlby One SC
- **Vintage serif:** Abril Fatface, Playfair Display SC, DM Serif Display, Yeseva One

**User uploads.** Drag a `.ttf` / `.otf` / `.woff` / `.woff2` onto the drop zone in the Text panel. Registers instantly via the FontFace API. Per-design only (not persisted).

**Favorites.** Star any font to pin it to the top of the picker across reloads. Stored in localStorage.

The picker shows a live preview of every font rendered in that face, so the user picks by look rather than by name. Built-in search filters by family name. Bold and Italic buttons grey out when the selected font has no bold or italic weight, rather than faking synthetic ones — one of the few Zazzle behaviors worth copying.

---

## Printing tips (Canon inkjet + light-fabric paper)

- Use the printer's **photo / high-quality** setting. Paper type = **Plain Paper**, not Photo Paper.
- Feed the transfer sheet coated-side-down per the package instructions.
- Let the print dry 1 to 2 minutes before peeling the backing and ironing.
- **Mirroring is required for light-fabric paper.** Export dialog defaults to it checked. Text reads correctly only after transfer.
- **Uncheck mirror for dark-fabric paper.** Dark-fabric paper does not require mirroring.

---

## Save, load, export

**Library (localStorage).** Saved designs get an SVG thumbnail and metadata, including which garment they were designed on. Open, duplicate, delete, or export/import the whole library as JSON for backup or transfer between devices.

**Export formats:**

- **Transparent PNG at 300 DPI** — the real print output. Only the ink prints; paper stays transparent. Pixel dimensions calibrated to the chosen paper size (see table at top).
- **SVG** — lossless vector export for other design tools. Uses the garment photo as a backdrop so the SVG stays portable.

**Export sizing:**

- **US Letter centered** — fits the design inside an 8.5 × 11" page with printer margins respected.
- **Tight crop to design** — bounding-box crop around the text with a small margin. Useful when you want to reuse leftover transfer paper.

---

## Technical shape

**Vite + TypeScript**, deployed as a static site to GitHub Pages. No backend, no database, no auth. Everything runs in the browser.

### File layout

```
printable/
  public/
    fonts/              bundled TTF / OTF font files
    mockups/            garment product photos
      primary-slub-pocket-tank-poppy-2.jpg
      primary-tank-dress-fuchsia-5.jpg
      primary-tank-dress-banana-5.jpg
  src/
    data/
      garments/
        index.ts        garment catalog
        types.ts        Garment, GarmentColor, GarmentSize
      fonts/
        local.ts        bundled font manifest with categories
        google.ts       Google Fonts manifest with categories
        types.ts        Font, FontCategory
      palette/
        solids.ts       solid color swatches
        gradients.ts    the three rainbows + any custom gradients
        types.ts        PaletteColor discriminated union
      size-charts.ts    brand size tables
    state/
      design.ts         current design: active garment, text layers, selected layer
      library.ts        saved designs (localStorage)
      calibration.ts    per-preset calibration cache (localStorage)
      favorites.ts      per-user font favorites (localStorage)
    canvas/
      renderer.ts       draws garment photo + safe area + text layers into an SVG
      export-png.ts     rasterizes a paper-sized SVG to 300 DPI PNG
      export-svg.ts     serializes the SVG for download
      interactions.ts   click / drag / resize handlers, pinch-zoom on mobile
      calibration.ts    the chest-width calibration dialog
    ui/
      garment-picker.ts seeded preset dropdown
      text-panel.ts     add/edit text, font, size (in inches), color
      color-picker.ts   solids and gradients in one grid
      font-picker.ts    categorized, searchable, favoritable, live previews
      effects-panel.ts  outline / shadow / curve / sparkles
      export-dialog.ts  paper size + mirror + crop + oversize warning
      library-panel.ts  saved designs
    main.ts
  index.html
  vite.config.ts
  tsconfig.json
  .github/workflows/deploy.yml
  README.md             this file
  CLAUDE.md             project brief for Claude Code
```

### Render pipeline

- All sizing is computed in **100 SVG units per inch**, so `size`, `letterSpacing`, `transform.x/y`, and export measurements flow through one consistent unit system.
- The design view is a single `<svg>` with the garment photo as an `<image>` backdrop. Calibration sets the viewBox so 1 unit = 0.01 inches of real garment.
- Each text layer becomes a `<g>` positioned in real-inch coordinates on the garment, with its own transform, fill, optional filter, and optional `textPath` for curve/arc.
- Per-letter colors render as separate `<tspan>` elements. Gradients and rainbows are `<linearGradient>` defs referenced by `fill="url(#...)"`. Drop shadows are SVG filter primitives.
- Safe print area is a `<rect>` overlay with `stroke-dasharray`, positioned from the garment's size-chart values scaled by the calibration ratio.
- **PNG export** constructs a separate paper-sized SVG (just the text layers, no garment photo, on a transparent background), then rasterizes it through an offscreen `<canvas>` at 300 DPI. The garment coordinates translate into paper coordinates at export time.

### Data models

Three TypeScript types do most of the load-bearing work.

**Garment.** A record with its mockup image, its size-chart entry (chest width, bodice dimensions, safe print area in inches), its colorway, and an optional calibration override (the pixels-per-inch ratio from the user's clicks on the photo). Adding a fourth garment is one object in one file.

**Font.** Family name, display name, file path or Google Fonts URL, category, and boolean flags for `hasBold` and `hasItalic`. The flags drive the Bold/Italic button state.

**PaletteColor.** A discriminated union:

```ts
type PaletteColor =
  | { kind: 'solid'; hex: string; name: string }
  | { kind: 'linear-gradient'; stops: { offset: number; hex: string }[]; angle: number; name: string }
  | { kind: 'radial-gradient'; stops: { offset: number; hex: string }[]; name: string }
  | { kind: 'per-letter' }
```

The color picker iterates one array. The renderer switches on `kind`. Adding a new gradient preset is one object appended to `gradients.ts`.

---

## Adding content

### A new local font

1. Drop the `.ttf` / `.otf` file into `public/fonts/`.
2. Add an entry to `src/data/fonts/local.ts`:
   ```ts
   {
     id: 'my-handwriting',
     family: 'My Handwriting',
     file: 'MyHandwriting.ttf',
     category: 'script',
     hasBold: false,
     hasItalic: false,
   }
   ```
3. Reload. The font appears in the Script category in the picker.

### A new Google Font

1. Add an entry to `src/data/fonts/google.ts`:
   ```ts
   {
     id: 'bungee-inline',
     family: 'Bungee Inline',
     category: 'varsity',
     weights: ['400'],
     hasBold: false,
     hasItalic: false,
   }
   ```
2. Reload. The font fetches lazily when its category is opened.

### A new garment preset

1. Drop the product photo into `public/mockups/`.
2. Add an entry to `src/data/garments/index.ts`:
   ```ts
   {
     id: 'unique-id',
     label: 'Display name',
     brand: 'primary',            // must exist in BRAND_CHARTS
     size: '5',                   // must exist for that brand
     garment: 'dress',            // 'tank' | 'dress' | 'tee'
     colorway: {
       name: 'Fuchsia',
       hex: '#d8177e',
     },
     image: 'primary-tank-dress-fuchsia-5.jpg',
   }
   ```
3. First time the preset is picked, the user calibrates via chest-width clicks. Calibration caches per preset per browser.

### A new rainbow preset

1. Add an entry to `src/data/palette/gradients.ts`:
   ```ts
   {
     kind: 'linear-gradient',
     name: 'Neon Rainbow',
     angle: 90,
     stops: [
       { offset: 0, hex: '#ff00ff' },
       { offset: 0.5, hex: '#00ffff' },
       { offset: 1, hex: '#ffff00' },
     ],
   }
   ```
2. Reload. Appears as a swatch in the color picker, alongside solids and the other gradients.

### A new brand to the size chart

1. Add an entry to `BRAND_CHARTS` in `src/data/size-charts.ts` with `label`, `notes`, and a `sizes` map keyed by size name. Each size needs `chestWidthIn`, `bodyLengthIn`, `printAreaWidthIn`, `printAreaHeightIn`, and `skirtLengthIn` for dresses.
2. Primary-specific note: Primary doesn't publish garment measurements, so those values are approximate. Calibration with a real garment overrides them.

---

## Status and scope

MVP scope:

- Three seeded garments (slub pocket tank Poppy 2, tank dress Fuchsia 5, tank dress Banana 5).
- Chest-width calibration on first use of each preset, cached per browser.
- Design view with the garment photo as the canvas and a dashed safe print area.
- One text layer with: content, font, size (in real inches), solid color or gradient.
- Drag to move, corner drag to resize on the garment.
- Safe-area warning (advisory, not blocking).
- Export dialog with paper size, mirror toggle, oversize warning, 300 DPI PNG output.
- localStorage library for save/open/delete.

Explicitly deferred to post-MVP:

- Per-letter color, outline, shadow, curve, sparkles.
- Multi-layer design (more than one text block at a time).
- Rotation handle.
- Tight-crop export mode.
- SVG export.
- Font upload via drop zone.
- Favorites.
- Calibration override by typed tape measurement.
- Additional garments beyond the seeded three.
- Back-side design (v2 only covers the front of each garment).

Post-MVP features all slot into the data models defined for MVP, so adding them later is additive, not a rewrite.

---

## Contributing

This is a personal project. Issues and suggestions welcome.
