---
name: carousel
description: "Generate complete Instagram carousels — from topic to ready-to-post PNGs. Includes content writing, slide rendering, and delivery."
---

# /carousel

The mother skill — generate a complete Instagram carousel from topic to ready-to-post PNGs.

## Usage
`/carousel [topic or description]`

## Engine Path

The carousel engine lives at `.claude/skills/carousel/` within the project root. Use this to find it:
```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
```

Config: `$CAROUSEL_DIR/config.json` — read `deliveryPath` from here for the Windows copy command.

## Pipeline

### Step 1: Content (`/carousel-copy` logic)
Generate all slide content — headlines, sublines, terminal commands.
- Load config for voice, niche, handle
- Show the user the slide breakdown for approval
- Wait for OK before rendering

### Step 2: Design (`/carousel-design` logic)
Vor dem Render: **Light oder Dark Mode?** fragen (wenn nicht schon angegeben).

Render in einen benannten Subordner `output/<slug>/` (nie direkt in `output/`).
Verwende immer `loadSlides()` statt `require()` für die JSON-Datei.

```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
cd "$CAROUSEL_DIR"
# Light mode:
node -e "const {renderSlides,loadSlides}=require('./build-carousel'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"
# Dark mode:
node -e "const {renderSlides,loadSlides}=require('./build-carousel-dark'); const src='./slides-<slug>.json'; renderSlides(loadSlides(src),'./output/<slug>',src).then(()=>console.log('done'))"
```

After a successful render the build script moves `slides-<slug>.json` into `output/<slug>/` automatically.

### Step 3: Deliver
Read `deliveryPath` from config, then copy only from the run subfolder:
```bash
DELIVERY="$(node -e "console.log(require('$CAROUSEL_DIR/config.json').deliveryPath)")"
cp "$CAROUSEL_DIR/output/<slug>/"*.png "$DELIVERY/"
ls -lh "$CAROUSEL_DIR/output/<slug>/"*.png
```

## Flow
1. If no topic provided, ask what the carousel should be about
2. Run `/carousel-copy` logic — generate slide JSON using config voice/niche
3. Present the slide breakdown for approval
4. Ask: **Light oder Dark Mode?**
5. On approval, run `/carousel-design` logic — render PNGs in `output/<slug>/`
6. Copy only `output/<slug>/*.png` to delivery path, show file list
7. Done

## Rules
- Always get approval on the copy BEFORE rendering
- If the user wants changes to specific slides, update the JSON and re-render only those
- Never skip the approval step — always review copy first
- Terminal bullet symbols (`✗`, `✓`, `→`) must always be followed by a space: `<span class="check">✓</span> Text`
- **German quotes in JSON**: Always use Unicode `"` (U+201D) as closing quote — never ASCII `"`. Correct: `„Kein Schmerz mehr"` · Wrong: `„Kein Schmerz mehr"`

## Related Skills
- `/carousel-idea` — brainstorm carousel topics
- `/carousel-copy` — just the content, no rendering
- `/carousel-design` — just the rendering, from existing JSON
