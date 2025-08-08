#!/bin/bash

# DrugAlert.gr Deployment Script for Hetzner Cloud
# Optimized for CX11 (2GB RAM)

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="drugalert.gr"
API_DOMAIN="api.drugalert.gr"
DB_NAME="drugalert_db"
DB_USER="drugalert_user"
DB_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Functions
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting DrugAlert.gr deployment on Hetzner Cloud..."
echo ""

# Create swap file (important for 2GB RAM)
print_status "Creating 2GB swap file for stability..."
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Update system
print_status "Updating system..."
apt update && apt upgrade -y

# Install packages
print_status "Installing required packages..."
apt install -y \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    nginx \
    certbot \
    python3-certbot-nginx \
    nodejs \
    npm \
    git \
    supervisor \
    ufw \
    curl \
    build-essential \
    htop

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# PostgreSQL setup
print_status "Setting up PostgreSQL..."
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\q
EOF

# Create app directory
print_status "Setting up application..."
mkdir -p /var/www/drugalert
cd /var/www/drugalert

# Clone repository
git clone https://github.com/ghatzlv8/drugalert-gr.git .

# Python setup
print_status "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Generate VAPID keys
print_status "Generating VAPID keys..."
npm install -g web-push
VAPID_KEYS=$(web-push generate-vapid-keys --json)
VAPID_PUBLIC=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.load(sys.stdin)['publicKey'])")
VAPID_PRIVATE=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.load(sys.stdin)['privateKey'])")

# Backend config
cat > .env <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}
JWT_SECRET_KEY=${JWT_SECRET}
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
FRONTEND_URL=https://${DOMAIN}
VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE}
VAPID_EMAIL=mailto:support@${DOMAIN}
EOF

# Frontend setup
print_status "Building frontend (this may take a few minutes)..."
cd frontend
cat > .env.production.local <<EOF
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}
NEXT_PUBLIC_VAPID_KEY=${VAPID_PUBLIC}
EOF

npm install
npm run build
cd ..

# Create systemd service
print_status "Creating backend service..."
cat > /etc/systemd/system/drugalert-api.service <<EOF
[Unit]
Description=DrugAlert API
After=network.target postgresql.service

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/var/www/drugalert
Environment="PATH=/var/www/drugalert/venv/bin"
ExecStart=/var/www/drugalert/venv/bin/gunicorn api_combined:app -w 2 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# PM2 frontend
print_status "Setting up frontend service..."
cd /var/www/drugalert/frontend
pm2 start npm --name "drugalert-frontend" -- start
pm2 save
pm2 startup systemd -u www-data --hp /var/www

# Nginx config
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/drugalert <<EOF
# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=web_limit:10m rate=30r/s;

# API server
server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 10M;
    }
}

# Frontend
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        limit_req zone=web_limit burst=50 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /sw.js {
        proxy_pass http://127.0.0.1:3000/sw.js;
        proxy_set_header Service-Worker-Allowed /;
        add_header Cache-Control "no-cache";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/drugalert /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

# Permissions
chown -R www-data:www-data /var/www/drugalert

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable drugalert-api
systemctl start drugalert-api
systemctl reload nginx

# Firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Cron jobs
print_status "Setting up cron jobs..."
cat > /etc/cron.d/drugalert-scraper <<EOF
*/15 * * * * www-data cd /var/www/drugalert && /var/www/drugalert/venv/bin/python scheduler.py >> /var/www/drugalert/logs/cron.log 2>&1
EOF

mkdir -p /var/www/drugalert/logs
chown www-data:www-data /var/www/drugalert/logs

# Backup script
cat > /usr/local/bin/backup-drugalert.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/drugalert"
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump drugalert_db > $BACKUP_DIR/drugalert_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF
chmod +x /usr/local/bin/backup-drugalert.sh
echo "0 2 * * * root /usr/local/bin/backup-drugalert.sh" > /etc/cron.d/drugalert-backup

# Save config
cat > /root/drugalert-config.txt <<EOF
DrugAlert.gr Configuration
==========================
Database: ${DB_NAME}
DB User: ${DB_USER}
DB Pass: ${DB_PASS}
JWT Secret: ${JWT_SECRET}
VAPID Public: ${VAPID_PUBLIC}
VAPID Private: ${VAPID_PRIVATE}

Next Steps:
1. Point DNS to this server
2. Run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${API_DOMAIN}
3. Update Stripe keys in /var/www/drugalert/.env
EOF

print_info "======================================"
print_info "Deployment Complete!"
print_info "======================================"
print_info ""
print_info "Config saved to: /root/drugalert-config.txt"
print_info ""
print_warning "NEXT STEPS:"
print_warning "1. Update DNS records to point to: $(curl -s ipinfo.io/ip)"
print_warning "2. After DNS propagation, run SSL setup"
print_warning "3. Update Stripe keys"
print_info ""
print_status "Your app is running on HTTP for now"
