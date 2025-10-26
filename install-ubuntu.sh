#!/bin/bash

# PowerOLT Auto-Install Script for Ubuntu 22.04 LTS
# This script automatically installs and configures PowerOLT on Ubuntu 22.04

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Please run as a regular user with sudo privileges."
    fi
}

# Check Ubuntu version
check_ubuntu() {
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine OS version"
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        error "This script is designed for Ubuntu only"
    fi
    
    if [[ "$VERSION_ID" != "22.04" ]]; then
        warning "This script is tested on Ubuntu 22.04. Your version: $VERSION_ID"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Update system
update_system() {
    log "Updating system packages..."
    sudo apt update
    sudo apt upgrade -y
    sudo apt install -y curl wget git build-essential
}

# Install Node.js 18
install_nodejs() {
    log "Installing Node.js 18..."
    
    # Check if Node.js is already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ "$NODE_VERSION" -ge "18" ]]; then
            info "Node.js $NODE_VERSION is already installed"
            return
        else
            warning "Node.js version $NODE_VERSION found. Upgrading to version 18..."
        fi
    fi
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node --version
    npm --version
}

# Install PM2
install_pm2() {
    log "Installing PM2 process manager..."
    
    if command -v pm2 &> /dev/null; then
        info "PM2 is already installed"
        return
    fi
    
    sudo npm install -g pm2
    
    # Setup PM2 startup script
    pm2 startup | grep -E '^sudo' | bash || true
}

# Install Nginx
install_nginx() {
    log "Installing and configuring Nginx..."
    
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
}

# Configure firewall
configure_firewall() {
    log "Configuring UFW firewall..."
    
    sudo ufw --force enable
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'
    sudo ufw allow 3000  # Backend API
    sudo ufw allow 5173  # Frontend dev server (if needed)
    sudo ufw status
}

# Clone and setup PowerOLT
setup_powerolt() {
    log "Cloning PowerOLT repository..."
    
    # Remove existing directory if it exists
    if [[ -d "PowerOLT" ]]; then
        warning "PowerOLT directory already exists. Removing..."
        rm -rf PowerOLT
    fi
    
    git clone https://github.com/erlangh/PowerOLT.git
    cd PowerOLT
    
    log "Installing server dependencies..."
    cd server
    npm install --production
    
    log "Installing client dependencies and building..."
    cd ../client
    npm install

    # Write production env for client (use Nginx proxy paths)
    cat > .env.production << 'EOF'
VITE_API_URL=/api
VITE_SOCKET_URL=
EOF

    npm run build
    
    cd ..
}

# Create PM2 ecosystem file
create_pm2_config() {
    log "Creating PM2 ecosystem configuration..."
    
    cat > server/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'powerolt-api',
    script: 'index.js',
    cwd: '/home/' + process.env.USER + '/PowerOLT/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/' + process.env.USER + '/PowerOLT/logs/api-error.log',
    out_file: '/home/' + process.env.USER + '/PowerOLT/logs/api-out.log',
    log_file: '/home/' + process.env.USER + '/PowerOLT/logs/api-combined.log',
    time: true
  }]
};
EOF
    
    # Create logs directory
    mkdir -p logs
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Resolve server name: prefer DOMAIN env var, else public IP
    SERVER_NAME=${DOMAIN:-$(curl -s ifconfig.me || echo "localhost")}
    
    sudo tee /etc/nginx/sites-available/powerolt << EOF
server {
    listen 80;
    server_name $SERVER_NAME localhost;

    # Frontend static files
    location / {
        root /home/$(whoami)/PowerOLT/client/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/powerolt /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    sudo nginx -t
    sudo systemctl reload nginx
}

# Optional SSL setup with Let's Encrypt
setup_ssl() {
    if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
        log "Setting up SSL with Let's Encrypt for $DOMAIN..."
        sudo apt install -y certbot python3-certbot-nginx
        sudo ufw allow 443 || true
        # Ensure Nginx site is enabled and running before certbot
        sudo systemctl restart nginx
        # Obtain certificate and enable HTTPS redirect
        sudo certbot --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --no-eff-email --redirect --non-interactive || {
            warning "Certbot failed. Check domain DNS and firewall, then run certbot manually."
        }
    else
        info "Skipping SSL setup. Provide DOMAIN and EMAIL env vars to enable."
        info "Example: DOMAIN=example.com EMAIL=admin@example.com bash install-ubuntu.sh"
    fi
}

# Start services
start_services() {
    log "Starting PowerOLT services..."
    
    cd server
    pm2 start ecosystem.config.js
    pm2 save
    
    # Show status
    pm2 status
}

# Create systemd service for auto-start
create_systemd_service() {
    log "Creating systemd service for auto-start..."
    
    sudo tee /etc/systemd/system/powerolt.service << EOF
[Unit]
Description=PowerOLT FTTH Management System
After=network.target

[Service]
Type=forking
User=$(whoami)
WorkingDirectory=/home/$(whoami)/PowerOLT/server
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable powerolt
}

# Show final information
show_info() {
    SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
    
    echo
    log "PowerOLT installation completed successfully!"
    echo
    info "Access your PowerOLT system at:"
    if [[ -n "$DOMAIN" ]]; then
        info "  Web Interface: https://$DOMAIN"
        info "  API Endpoint: https://$DOMAIN/api"
    else
        info "  Web Interface: http://$SERVER_IP"
        info "  API Endpoint: http://$SERVER_IP/api"
    fi
    echo
    info "Useful commands:"
    info "  Check status: pm2 status"
    info "  View logs: pm2 logs powerolt-api"
    info "  Restart: pm2 restart powerolt-api"
    info "  Stop: pm2 stop powerolt-api"
    echo
    info "System services:"
    info "  Nginx: sudo systemctl status nginx"
    info "  PowerOLT: sudo systemctl status powerolt"
    echo
    warning "Make sure to:"
    warning "  1. Configure your domain/DNS if using a domain name"
    warning "  2. Set up SSL certificate for production use"
    warning "  3. Configure backup for the SQLite database"
    warning "  4. Review and adjust firewall rules as needed"
    echo
}

# Main installation function
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "  PowerOLT Auto-Install Script for Ubuntu 22.04"
    echo "=================================================="
    echo -e "${NC}"
    
    check_root
    check_ubuntu
    
    log "Starting PowerOLT installation..."
    
    update_system
    install_nodejs
    install_pm2
    install_nginx
    configure_firewall
    setup_powerolt
    create_pm2_config
    configure_nginx
    setup_ssl
    start_services
    create_systemd_service
    
    show_info
}

# Run main function
main "$@"