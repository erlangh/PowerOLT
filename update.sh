#!/bin/bash
set -e

# PowerOLT Update Script
# Safely updates backend and frontend on a VPS

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}"; }
err() { echo -e "${RED}[ERROR] $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Optional: backup SQLite DB before updating
backup_db() {
  if [[ -f server/powerolt.db ]]; then
    mkdir -p backups
    TS=$(date +'%Y%m%d-%H%M%S')
    cp server/powerolt.db "backups/powerolt-$TS.db"
    log "Database backed up to backups/powerolt-$TS.db"
  else
    warn "No database file found at server/powerolt.db; skipping backup"
  fi
}

update_repo() {
  log "Pulling latest changes..."
  git fetch --all
  git reset --hard origin/main || true
  git pull --rebase || true
}

update_server() {
  log "Updating server dependencies..."
  cd server
  npm install --production
  cd - >/dev/null
}

update_client() {
  log "Updating client dependencies and rebuilding..."
  cd client
  npm install
  npm run build
  cd - >/dev/null
}

reload_services() {
  log "Reloading PM2 and Nginx..."
  cd server
  pm2 reload ecosystem.config.js || pm2 start ecosystem.config.js
  pm2 save || true
  cd - >/dev/null
  sudo systemctl reload nginx || true
}

main() {
  log "Starting PowerOLT update"
  backup_db
  update_repo
  update_server
  update_client
  reload_services
  log "Update completed. Visit your site to verify functionality."
}

main "$@"