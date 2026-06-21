#!/bin/bash
# OpenCode setup for Shatebi project collaborators
# Run this after cloning the repo to set up global opencode skills and config
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

# Check prerequisites
command -v opencode >/dev/null 2>&1 || { warn "OpenCode CLI not found. Install from https://opencode.ai/download"; exit 1; }
command -v node >/dev/null 2>&1 || { warn "Node.js not found. Install Node.js 22+"; exit 1; }

OPENCODE_DIR="${OPENCODE_DIR:-$HOME/.opencode}"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"
SKILLS_SRC="$(cd "$(dirname "$0")/.." && pwd -P)/.opencode/skills"
BACKEND_DIR="$(cd "$(dirname "$0")/../../admin-shatebiapp" && pwd -P)"

info "=== Shatebi OpenCode Setup ==="
echo ""

# 1. Install project-level skills (symlink or copy)
info "1) Linking project skills..."
mkdir -p "$OPENCODE_DIR/skills"
for skill in design nextjs-frontend-stack persian-ecommerce laravel-filament-admin; do
  if [ -d "$OPENCODE_DIR/skills/$skill" ]; then
    info "   Skill '$skill' already installed"
  else
    warn "   Skill '$skill' not found globally. Install instructions in AGENTS.md"
  fi
done

# 2. GSD installation (optional)
info "2) GSD workflow (optional)..."
if command -v npx >/dev/null 2>&1; then
  if [ -d "$CLAUDE_DIR/skills/gsd-core" ]; then
    info "   GSD already installed"
  else
    warn "   GSD not installed. Run: npx gsd-core install"
  fi
fi

# 3. Environment setup
info "3) Environment files..."
if [ -f "$(dirname "$0")/../.env" ]; then
  info "   .env exists"
else
  cp "$(dirname "$0")/../.env.example" "$(dirname "$0")/../.env" 2>/dev/null && info "   Created .env from .env.example" || warn "   Create .env manually from .env.example"
fi

# 4. Backend AGENTS.md
info "4) Backend AGENTS.md..."
if [ -f "$BACKEND_DIR/AGENTS.md" ]; then
  info "   Found at $BACKEND_DIR/AGENTS.md"
else
  warn "   Not found — clone admin-shatebiapp repo alongside shatebiapp"
fi

echo ""
info "=== Setup complete ==="
echo ""
info "Next steps:"
info "  1. Install npm dependencies: cd shatebiapp && npm install"
info "  2. Copy .env.example to .env and configure NEXT_PUBLIC_API_URL"
info "  3. Start dev server: npm run dev"
info "  4. For backend setup, clone admin-shatebiapp repo and follow its README"
info ""
info "Global skills to install manually via opencode:"
info "  - nextjs-frontend-stack: Next.js + Zustand + shadcn/ui patterns"
info "  - persian-ecommerce: Persian e-commerce backend patterns"
info "  - laravel-filament-admin: Laravel Filament admin panel patterns"
info "  - design: Already in project .opencode/skills/"
