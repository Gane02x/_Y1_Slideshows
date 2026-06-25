---
name: carousel-idea
description: "Generate 5-10 Instagram carousel ideas tailored to your niche and brand."
---

# /carousel-idea

Generate 5-10 Instagram carousel ideas tailored to your niche.

## Setup Check

Find config:
```bash
CAROUSEL_DIR="$(git rev-parse --show-toplevel)/.claude/skills/carousel"
```
Read `niche`, `voice`, and `handle` from `$CAROUSEL_DIR/config.json`.

## Process
1. Consider the user's niche (from config) and what's currently relevant in their space
2. Think about what pain points their audience has, what tools/methods they teach
3. Generate ideas that work as carousel format: step-by-step, listicle, how-to, myth-busting, frameworks

## Output format
For each idea:
- **Hook** — slide 1 headline (provocative, curiosity-driven, ALL CAPS)
- **Category pill** — matches their niche
- **Slide count** — recommended (5-10)
- **Structure** — brief outline of each slide
- **CTA keyword** — what viewers comment to get the resource
- **Terminal angle** — what content/data would appear in the terminals

## Content Formats That Work as Carousels
1. Step-by-step tutorials — "Do X in [N] steps"
2. Listicles — "[N] tools/tips/secrets for [outcome]"
3. Frameworks — "The [N] levels of [skill]"
4. Myth busting — "Stop doing [common thing]. Do [better thing] instead."
5. Before/after — showing transformation
6. Swaps — "Don't say X, say Y"

## After generating
Ask which ideas they want to turn into carousels. Once they pick one, offer to run `/carousel-copy` with that idea.
