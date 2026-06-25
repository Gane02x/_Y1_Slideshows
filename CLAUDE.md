# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

This is the working directory for Y1 Digital AG Instagram carousel generation. The actual carousel engine lives at `~/.claude/skills/carousel/`. This directory (`_Y1_Slideshows/`) holds the source asset zips:

- `y1-fonts-desktop.zip` — TWK Everett Light/Medium + TWKEverettMono Medium (commercial fonts)
- `y1-illustrationen-fein.zip` — 147 high-res PNGs (pink halftone style, transparent RGBA, ~1200–1800px)
- `y1-illustrationen-grob.zip` — 147 low-res PNGs (pixel art style, same subjects)
- `y1-icons.zip` — ~2900 SVG icons, 24×24 viewBox, black stroke-width 1.5

## Carousel Engine (`.claude/skills/carousel/`)

The engine lives at `.claude/skills/carousel/` within this repo. Find it dynamically:
```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
```

### First-Time Setup (once per machine)
```bash
chmod +x setup.sh && ./setup.sh
```
Then set `deliveryPath` in `.claude/skills/carousel/config.json` to your local Downloads folder.

### Rendering Stack
**sharp + inline SVG** — NOT Puppeteer. librsvg converts SVG → PNG internally. Do not attempt to install or use Puppeteer.

### Key Files
| File | Purpose |
|---|---|
| `build-carousel.js` | Light mode renderer — exports `renderSlides(slides, outputDir, srcPath)` |
| `build-carousel-dark.js` | Dark mode renderer — identical API, dark background |
| `config.json` | Brand config + `deliveryPath` (set per machine, not shared) |
| `slides-sample.json` | Example slide data for the slide types |
| `assets/` | Populated by `setup.sh` from zips — not in git |
| `output/` | Rendered PNGs, organized into named subfolders per run — not in git |

### Running the Renderer

Always render into a named subfolder `output/<slug>/`. Use `loadSlides()` (not `require()`) so the JSON gets auto-archived into the subfolder after render.

```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
cd "$CAROUSEL_DIR"
# Light mode
node -e "const {renderSlides,loadSlides}=require('./build-carousel'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"
# Dark mode
node -e "const {renderSlides,loadSlides}=require('./build-carousel-dark'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"
```

Delivery — reads `deliveryPath` from config:
```bash
DELIVERY="$(node -e "console.log(require('$CAROUSEL_DIR/config.json').deliveryPath)")"
cp "$CAROUSEL_DIR/output/<slug>/"*.png "$DELIVERY/"
```

### Slide JSON Fields
```json
{
  "name": "slide1-hook",          // output filename (no .png)
  "slideNum": "01 / 06",
  "stepLabel": "E-COMMERCE",      // shown as pill when isPill:true
  "headline": "Text <br> with <span class=\"accent\">pink</span>",
  "subline": "ALL CAPS DESCRIPTOR",
  "activateLabel": "Eyebrow label above terminal:",  // Sentence Case, NEVER all-caps
  "terminal": "<div class=\"t-line\"><span class=\"check\">✓</span> text</div>",
  "isHook": true,                 // adds corner accents
  "isPill": true,                 // renders stepLabel as badge pill
  "isCTA": true,                  // centered keyword box layout
  "ctaKeyword": "Produktdaten",   // keyword in the CTA box
  "illustration": "Einkaufswagen-Cart",  // filename without .png
  "illustrationType": "fein"      // "fein" or "grob"
}
```

**Never set `headlineSize`** — omit the field entirely. Defaults (68px Hook / 60px Content) work for all line counts. If a headline overflows, shorten the text.

Terminal span classes: `.check` (✓/✗), `.arrow` (→), `.cmd` (pink accent), `.prompt`  
Terminal text wraps at **798px** max; the terminal box itself spans full content width.  
Subline wraps at **784px** max.

### Slide Types
1. **Hook** (`isHook: true, isPill: true`) — corner accents, pill badge, illustration lower-half (max 700×700). Footer: **logo upper-right only** — no @y1digital handle on hook slides.
2. **Content** (default) — step label, separator line, content block, illustration lower-right (max 420×420). Footer: logo bottom-left + centered handle.
3. **CTA** (`isCTA: true`) — centered keyword box with pink border, "FOLGE @Y1DIGITAL", no terminal/illustration

### Known SVG/librsvg Quirks
- `xml:space="preserve"` is **required** on every `<text>` with `<tspan>` children — librsvg collapses inter-tspan spaces without it
- `<image>` elements must have **both** `width` and `height` set explicitly — width-only silently fails
- PNG dimensions are read from file header bytes 16–23 (`buf.readUInt32BE(16)` = width, `buf.readUInt32BE(20)` = height)

## Brand Rules

- **Dashes**: EN-dash (–) only — never EM-dash (—)
- **Language**: German
- **Colors**: bg `#f1f3f4`, text `#000000`, accent `#ff78ba`
- **Fonts**: TWK Everett (headline), TWK Everett Mono (labels/terminal)
- **Tone**: Direct, no-fluff. Decision-maker audience. No hedging.
- **Handle**: @y1digital

## Skills
- `/carousel [topic]` — full pipeline: copy → design → deliver
- `/carousel-copy` — generate slide JSON only (no rendering)
- `/carousel-design` — render PNGs from existing JSON
- `/carousel-idea` — brainstorm topics
