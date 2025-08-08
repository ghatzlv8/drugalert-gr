#!/bin/bash

# DrugAlert.gr Automated VPS Deployment Script
# For Hostinger VPS (Ubuntu 22.04)
# This script will set up everything automatically

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration variables
DOMAIN="drugalert.gr"
API_DOMAIN="api.drugalert.gr"
DB_NAME="drugalert_db"
DB_USER="drugalert_user"
DB_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Function to print colored output
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_info "Starting DrugAlert.gr deployment..."
print_info "This will set up your entire application automatically"
echo ""

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
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
    build-essential

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Set up PostgreSQL
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};
\q
EOF

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p /var/www/drugalert
cd /var/www/drugalert

# Clone repository
print_status "Cloning repository..."
git clone https://github.com/ghatzlv8/drugalert-gr.git .

# Set up Python virtual environment
print_status "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Generate VAPID keys
print_status "Generating VAPID keys for push notifications..."
npm install -g web-push
VAPID_KEYS=$(web-push generate-vapid-keys --json)
VAPID_PUBLIC=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.load(sys.stdin)['publicKey'])")
VAPID_PRIVATE=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.load(sys.stdin)['privateKey'])")

# Create backend .env file
print_status "Creating backend configuration..."
cat > .env <<EOF
# Database
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}

# JWT Configuration
JWT_SECRET_KEY=${JWT_SECRET}

# Stripe Configuration (UPDATE THESE!)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL
FRONTEND_URL=https://${DOMAIN}

# Push Notifications
VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE}
VAPID_EMAIL=mailto:support@${DOMAIN}

# Email Configuration (Optional - Update if needed)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@${DOMAIN}
EOF

# Set up frontend
print_status "Setting up frontend..."
cd frontend

# Create frontend .env file
cat > .env.production.local <<EOF
NEXT_PUBLIC_API_URL=https://${API_DOMAIN}
NEXT_PUBLIC_VAPID_KEY=${VAPID_PUBLIC}
EOF

# Install frontend dependencies
npm install

# Build frontend
print_status "Building frontend..."
npm run build

cd ..

# Create systemd service for backend
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
ExecStart=/var/www/drugalert/venv/bin/gunicorn api_combined:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set up PM2 for frontend
print_status "Setting up frontend with PM2..."
cd /var/www/drugalert/frontend
pm2 start npm --name "drugalert-frontend" -- start
pm2 save
pm2 startup systemd -u www-data --hp /var/www

# Create Nginx configuration
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/drugalert <<'EOF'
# API server
server {
    listen 80;
    server_name ${API_DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend server
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Service Worker
    location /sw.js {
        proxy_pass http://127.0.0.1:3000/sw.js;
        proxy_set_header Service-Worker-Allowed /;
        add_header Cache-Control "no-cache";
    }
}
EOF

# Replace variables in Nginx config
sed -i "s/\${DOMAIN}/$DOMAIN/g" /etc/nginx/sites-available/drugalert
sed -i "s/\${API_DOMAIN}/$API_DOMAIN/g" /etc/nginx/sites-available/drugalert

# Enable Nginx site
ln -sf /etc/nginx/sites-available/drugalert /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Set permissions
print_status "Setting permissions..."
chown -R www-data:www-data /var/www/drugalert

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable drugalert-api
systemctl start drugalert-api
systemctl reload nginx

# Set up firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create cron job for scraper
print_status "Setting up scraper cron job..."
cat > /etc/cron.d/drugalert-scraper <<EOF
# Run EOF scraper every 15 minutes
*/15 * * * * www-data cd /var/www/drugalert && /var/www/drugalert/venv/bin/python scheduler.py >> /var/www/drugalert/logs/cron.log 2>&1
EOF

# Create logs directory
mkdir -p /var/www/drugalert/logs
chown www-data:www-data /var/www/drugalert/logs

# Create database backup script
print_status "Creating backup script..."
cat > /usr/local/bin/backup-drugalert.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/drugalert"
mkdir -p $BACKUP_DIR
pg_dump -U ${DB_USER} ${DB_NAME} > $BACKUP_DIR/drugalert_$(date +%Y%m%d_%H%M%S).sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-drugalert.sh

# Add daily backup to cron
echo "0 2 * * * root /usr/local/bin/backup-drugalert.sh" > /etc/cron.d/drugalert-backup

# Save configuration
print_status "Saving configuration..."
cat > /root/drugalert-config.txt <<EOF
DrugAlert.gr Deployment Configuration
=====================================

Database Name: ${DB_NAME}
Database User: ${DB_USER}
Database Password: ${DB_PASS}

JWT Secret: ${JWT_SECRET}

VAPID Public Key: ${VAPID_PUBLIC}
VAPID Private Key: ${VAPID_PRIVATE}

IMPORTANT: Save this file securely!

Next Steps:
1. Update DNS records:
   - Point drugalert.gr to this server's IP
   - Point api.drugalert.gr to this server's IP

2. After DNS propagation, run:
   certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${API_DOMAIN}

3. Update Stripe keys in /var/www/drugalert/.env

4. Configure Stripe webhook:
   https://${API_DOMAIN}/auth/stripe/webhook
EOF

print_info "============================================"
print_info "Deployment Complete!"
print_info "============================================"
print_info ""
print_info "Configuration saved to: /root/drugalert-config.txt"
print_info ""
print_warning "IMPORTANT NEXT STEPS:"
print_warning "1. Update your DNS records to point to this server"
print_warning "2. Wait for DNS propagation (5-30 minutes)"
print_warning "3. Run: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} -d ${API_DOMAIN}"
print_warning "4. Update Stripe keys in /var/www/drugalert/.env"
print_warning "5. Test your site at https://${DOMAIN}"
print_info ""
print_status "Your application is running!"
print_info "API: http://${API_DOMAIN} (will be HTTPS after SSL setup)"
print_info "Frontend: http://${DOMAIN} (will be HTTPS after SSL setup)"
