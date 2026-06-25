#!/usr/bin/env bash
# Y1 Carousel Setup — run once after cloning
# Extracts assets from zips and installs npm dependencies.

set -e
REPO_ROOT="$(git rev-parse --show-toplevel)"
CAROUSEL="$REPO_ROOT/.claude/skills/carousel"
ASSETS="$CAROUSEL/assets"

echo "→ Setting up Y1 carousel engine..."

# ── Assets ────────────────────────────────────────────────────────────────────

mkdir -p "$ASSETS/fonts" "$ASSETS/illustrations-fein" "$ASSETS/illustrations-grob" "$ASSETS/icons"

echo "  Extracting fonts..."
unzip -oq "$REPO_ROOT/y1-fonts-desktop.zip" -d "$ASSETS/fonts"

echo "  Extracting illustrations (fein)..."
unzip -oq "$REPO_ROOT/y1-illustrationen-fein.zip" -d "$ASSETS/illustrations-fein"

echo "  Extracting illustrations (grob)..."
unzip -oq "$REPO_ROOT/y1-illustrationen-grob.zip" -d "$ASSETS/illustrations-grob"

echo "  Extracting icons..."
unzip -oq "$REPO_ROOT/y1-icons.zip" -d "$ASSETS/icons"

# ── Copy logos (already in assets at user level, keep in repo directly) ───────
if [ -f "$REPO_ROOT/.claude/skills/carousel/assets/y1-logo.svg" ]; then
  echo "  Logos already present."
fi

# ── npm dependencies ──────────────────────────────────────────────────────────

echo "  Installing npm dependencies (sharp)..."
cd "$CAROUSEL" && npm install --silent

# ── Delivery path ─────────────────────────────────────────────────────────────

echo ""
echo "✓ Setup complete."
echo ""
echo "  One manual step: set your delivery path in:"
echo "  .claude/skills/carousel/config.json  →  \"deliveryPath\""
echo ""
echo "  Windows/WSL example:  /mnt/c/Users/YOUR_NAME/Downloads"
echo "  macOS example:        /Users/YOUR_NAME/Desktop"
echo ""
echo "  Then run:  /carousel [topic]"
