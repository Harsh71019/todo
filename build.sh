#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
CLIENT="$ROOT/client"
SERVER="$ROOT/server"

BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

step() { echo -e "\n${BLUE}${BOLD}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; exit 1; }

echo -e "${BOLD}Taskflow — macOS build${RESET}"
echo "────────────────────────────────────"

# 1. Build React frontend
step "Building frontend (Vite + TypeScript)"
cd "$CLIENT"
npm run build || fail "Client build failed"
ok "Frontend built → client/dist"

# 2. Wipe stale server artefacts
step "Cleaning server/dist and server/public"
rm -rf "$SERVER/dist" "$SERVER/public"
ok "Cleaned"

# 3. Compile server TypeScript
step "Compiling server (TypeScript)"
cd "$SERVER"
npm run compile || fail "Server TypeScript compilation failed"
ok "Server compiled → server/dist"

# 4. Copy frontend into server/public (Electron serves it from there)
step "Copying frontend into server/public"
cp -R "$CLIENT/dist" "$SERVER/public"
ok "Copied → server/public"

# 5. Package with electron-builder
step "Packaging macOS DMG"
cd "$SERVER"
npx electron-builder --mac || fail "electron-builder failed"
ok "DMG built"

# Print output location
DMG=$(find "$SERVER/dist" -name "*.dmg" 2>/dev/null | head -1)
if [[ -n "$DMG" ]]; then
  echo -e "\n${GREEN}${BOLD}Done!${RESET}"
  echo -e "  DMG → ${YELLOW}$DMG${RESET}\n"
else
  echo -e "\n${GREEN}${BOLD}Done!${RESET} (check server/dist for the DMG)\n"
fi
