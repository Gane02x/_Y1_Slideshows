---
name: carousel-copy
description: "Generate structured carousel slide content in your voice for Instagram carousels."
---

# /carousel-copy

Generate structured carousel slide content for your brand's carousel template.

## Setup Check

Find the carousel engine:
```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
```
Read config from `$CAROUSEL_DIR/config.json`. If it doesn't exist, tell the user to run `setup.sh` first.

## Input
A topic, hook idea, video transcript, or brief description of what the carousel should be about.

## Output
A JSON array of slide objects ready for `/carousel-design`. Each object has:
```json
{
  "name": "slide1-hook",
  "slideNum": "01 / 07",
  "stepLabel": "CATEGORY",
  "headline": "BIG TEXT<br>WITH <span class=\"accent\">ACCENT</span>",
  "subline": "SUPPORTING TEXT IN ALL CAPS.",
  "activateLabel": "Eyebrow label above terminal:",
  "terminal": "<div class=\"t-line\">...</div>",
  "isPill": false,
  "isHook": false,
  "isCTA": false
}
```

## Slide Structure Rules

### Number of slides
- Minimum 5, maximum 10 slides
- Always have: Hook (1st), CTA (last). Middle slides are the content.

### Slide 1 — Hook (always)
- `isHook: true`, `isPill: true`
- Headline: provocative, attention-grabbing, creates curiosity
- One accent-colored word or phrase that hits hardest
- Subline: one sentence teasing what's coming
- Terminal: preview of the topic (key stats, outcome preview — kein `$`-Prompt wenn nicht technisch)
- stepLabel: category pill — für Y1-Carousels nach Thema wählen:
  - Thema = Produktdaten / PIM / Produktstammdaten → **Product Experience**
  - Thema = Shops / Commerce / Checkout → **Commerce Experience**
  - Thema = UX / Design / Customer Journey → **Customer Experience**
  - Thema = übergreifend / Team-Alignment / alle Disziplinen → **PXM**
  - Nie pauschal "TAILOR-MADE" verwenden — zu abstrakt für die Zielgruppe
- illustration + illustrationType: **PFLICHT** (illustrationType: "fein")

### Content Slides (middle)
- Each slide = one key point, step, or tool
- stepLabel: "STEP 01", "STEP 02", etc. OR descriptive labels — **PFLICHT**
- Headline: 2-4 lines max, the KEY concept in accent color
- Subline: 1-2 sentences explaining WHY this matters
- activateLabel: Eyebrow-Text über der Terminal-Box — **PFLICHT**, nie weglassen — in Sentence Case schreiben, NICHT in ALL CAPS (z.B. "Realität:", "Die Frage:", "Das Ergebnis:")
- illustration + illustrationType: **PFLICHT** für alle Content-Slides (illustrationType: "grob")
- Terminal: Inhalt je nach Thema (siehe Terminal Content Rules unten)

### Last Slide — CTA (always)
- `isCTA: true`, `slideNum: ""`
- headline + subline + ctaKeyword
- No terminal, no illustration

## Terminal Content Rules
- Use `.t-line` wrapper for each line
- `<span class="check">✓</span>` / `<span class="check">✗</span>` for true/false statements
- `<span class="arrow">→</span>` for progress, flow, or consequences
- `<span class="cmd">text</span>` for pink-accented key terms
- Keep terminal content SHORT — 2-4 lines per slide

**`$`-Prompt NUR für echte Shell-Befehle:**
- Bei nicht-technischen Slides: ausschließlich `→` und `✓`/`✗`

## Headline Sizing
- Never set `headlineSize` — omit the field entirely
- Renderer defaults are: Hook → 68px, Content → 60px — these work for all line counts
- If a headline overflows (long German compound words), shorten the headline text instead

## Voice & Style
Read voice description from config. Apply it to all copy:
- ALL CAPS for headlines and sublines — exception: `activateLabel` is always Sentence Case
- Short punchy sentences
- Tailor the niche/examples to the user's industry from config

## Available Illustrations

**Fein** (hook slides, large): See `assets/illustrations-fein/` — browse with `ls $CAROUSEL_DIR/assets/illustrations-fein/`
**Grob** (content slides, small): Same subjects, pixel style — `ls $CAROUSEL_DIR/assets/illustrations-grob/`

Source: https://y1-brand-guide.pages.dev/#/illustrationen/uebersicht/illu-bibliothek

## After generating the JSON:
1. Print it formatted for review
2. Ask if anything needs adjusting
3. Once approved, offer to run `/carousel-design` with the data automatically
