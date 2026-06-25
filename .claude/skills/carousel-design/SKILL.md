---
name: carousel-design
description: "Render Instagram carousel slides as PNGs from structured slide data using the Y1 sharp+SVG renderer."
---

# /carousel-design

Render Instagram carousel slides as PNGs from structured slide data.

## Setup Check

Find the carousel engine:
```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
```

Verify `$CAROUSEL_DIR/node_modules/sharp` exists. If missing:
```bash
cd "$CAROUSEL_DIR" && npm install
```

## Rendering Stack
**sharp + inline SVG** — NOT Puppeteer. librsvg converts SVG → PNG internally. Do not attempt to use Puppeteer or Chrome.

## Version Selection
Always ask **Light oder Dark Mode?** before rendering (skip only if already specified).

- Light → `build-carousel.js` (bg `#f1f3f4`, text `#000000`)
- Dark → `build-carousel-dark.js` (dark bg, white text)

## Render Command

Always render into a **named subfolder** `output/<slug>/` — never directly into `output/`.
Always use `loadSlides()` (not `require()`) so JSON is auto-archived after render.

```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
cd "$CAROUSEL_DIR"

# Write slides JSON first, then render:
node -e "const {renderSlides,loadSlides}=require('./build-carousel'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"

# Dark mode:
node -e "const {renderSlides,loadSlides}=require('./build-carousel-dark'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"
```

After a successful render the build script moves `slides-<slug>.json` into `output/<slug>/` automatically.

## Delivery

Read `deliveryPath` from config, copy only from the run subfolder:
```bash
DELIVERY="$(node -e "console.log(require('$CAROUSEL_DIR/config.json').deliveryPath)")"
cp "$CAROUSEL_DIR/output/<slug>/"*.png "$DELIVERY/"
ls -lh "$CAROUSEL_DIR/output/<slug>/"*.png
```

## Slide Types
1. **Hook** (`isHook: true, isPill: true`) — corner accents, pill badge, illustration lower-half (max 700×700). Footer: logo upper-right only, no handle.
2. **Content** (default) — step label, separator, content block, illustration lower-right (max 420×420). Footer: logo bottom-left + centered handle.
3. **CTA** (`isCTA: true`) — centered keyword box, "FOLGE @Y1DIGITAL", no terminal/illustration.

## Rules
- `headlineSize` — never set, omit the field entirely
- `activateLabel` — always Sentence Case, never ALL CAPS
- Terminal text wraps at 798px max; box spans full content width
- Subline wraps at 784px max
