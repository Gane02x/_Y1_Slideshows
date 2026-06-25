# Y1 Carousel Engine

Instagram-Karussell-Generator für Y1 Digital AG — von Thema bis fertigen PNGs, direkt aus Claude Code.

## Voraussetzungen

- [Claude Code](https://claude.ai/code) installiert
- Node.js ≥ 18
- WSL (Windows) oder macOS/Linux

## Setup (einmalig)

```bash
git clone https://github.com/gabor-nemeth-y1/y1-carousel.git
cd y1-carousel
./setup.sh
```

Danach in `.claude/skills/carousel/config.json` den eigenen Download-Pfad setzen:

```json
"deliveryPath": "/mnt/c/Users/DEIN_NAME/Downloads"
```

## Skills

| Skill | Funktion |
|---|---|
| `/carousel [thema]` | Vollständiger Durchlauf: Copy → Render → Deliver |
| `/carousel-copy` | Nur Slide-Texte generieren (JSON) |
| `/carousel-design` | Nur rendern aus bestehendem JSON |
| `/carousel-idea` | 5–10 Themenideen brainstormen |

## Wie es funktioniert

Der Renderer nutzt **sharp + inline SVG** (kein Puppeteer, kein Chrome). Slides werden als SVG gebaut und via librsvg in 1080×1440 px PNGs konvertiert.

Assets (Fonts, Illustrationen, Icons) liegen als Zips im Repo und werden durch `setup.sh` entpackt — sie landen nicht in git.

## Illustrationen & Icons

- Illustrationen: [y1-brand-guide.pages.dev](https://y1-brand-guide.pages.dev/#/illustrationen/uebersicht/illu-bibliothek)
- Icons: [y1-brand-guide.pages.dev](https://y1-brand-guide.pages.dev/#/icons/uebersicht/icons-ressourcen)

## Brand

| | |
|---|---|
| Handle | @y1digital |
| Hintergrund | `#f1f3f4` (Light) |
| Text | `#000000` |
| Akzent | `#ff78ba` |
| Headline-Font | TWK Everett |
| Mono-Font | TWK Everett Mono |
| Sprache | Deutsch, EN-Dash (–), kein EM-Dash |
