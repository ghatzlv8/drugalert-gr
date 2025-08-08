#!/bin/bash

# DrugAlert.gr Complete Server Setup Script
# Run this on a fresh Ubuntu server to set up everything

set -e  # Exit on error

echo "=== DrugAlert.gr Server Setup Script ==="
echo "This script will set up everything from scratch"
echo ""

# Update system
echo "1. Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "2. Installing required packages..."
apt-get install -y python3 python3-pip python3-venv git nginx postgresql postgresql-contrib ufw curl

# Clone repository
echo "3. Cloning repository..."
cd /root
rm -rf eof-scraper
git clone https://github.com/gcharalampous/eof-scraper.git

# Setup PostgreSQL
echo "4. Setting up PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE drugalert_db;
CREATE USER drugalert_user WITH PASSWORD 'DrugAlert2024!';
GRANT ALL PRIVILEGES ON DATABASE drugalert_db TO drugalert_user;
\q
EOF

# Setup backend
echo "5. Setting up backend..."
cd /root/eof-scraper/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Generate VAPID keys
echo "6. Generating VAPID keys..."
VAPID_KEYS=$(python -c "from py_vapid import Vapid; vapid = Vapid(); vapid.generate_keys(); import json; print(json.dumps({'private_key': vapid.get_private_key().to_pem().decode('utf-8').replace('\\n', ''), 'public_key': vapid.get_public_key().to_raw().hex()}))")
VAPID_PRIVATE=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['private_key'])")
VAPID_PUBLIC=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['public_key'])")

# Create backend .env file
echo "7. Creating backend .env file..."
cat > /root/eof-scraper/backend/.env << EOF
DATABASE_URL=postgresql://drugalert_user:DrugAlert2024!@localhost/drugalert_db
SECRET_KEY=$(openssl rand -base64 32)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
VAPID_PRIVATE_KEY=$VAPID_PRIVATE
VAPID_PUBLIC_KEY=$VAPID_PUBLIC
VAPID_EMAIL=info@drugalert.gr
EOF

# Create systemd service for backend
echo "8. Creating systemd service for backend..."
cat > /etc/systemd/system/drugalert-backend.service << 'EOF'
[Unit]
Description=DrugAlert Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/eof-scraper/backend
Environment="PATH=/root/eof-scraper/backend/venv/bin"
ExecStart=/root/eof-scraper/backend/venv/bin/uvicorn api:app --host 0.0.0.0 --port 8443
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start backend service
systemctl daemon-reload
systemctl enable drugalert-backend
systemctl start drugalert-backend

# Install Node.js
echo "9. Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Setup frontend
echo "10. Setting up frontend..."
cd /root/eof-scraper/frontend

# Create frontend .env.production.local
cat > .env.production.local << EOF
NEXT_PUBLIC_API_URL=https://drugalert.gr/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC
EOF

# Install dependencies and build
npm install
npm run build

# Install PM2 and start frontend
npm install -g pm2
pm2 start npm --name "drugalert-frontend" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Configure Nginx
echo "11. Configuring Nginx..."
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name drugalert.gr www.drugalert.gr api.drugalert.gr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name drugalert.gr www.drugalert.gr;

    ssl_certificate /etc/letsencrypt/live/drugalert.gr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drugalert.gr/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        rewrite ^/api(.*)$ $1 break;
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.drugalert.gr;

    ssl_certificate /etc/letsencrypt/live/drugalert.gr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drugalert.gr/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Setup firewall
echo "12. Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8443/tcp
ufw --force enable

# Setup SSL (if not already done)
echo "13. Setting up SSL certificates..."
if [ ! -d "/etc/letsencrypt/live/drugalert.gr" ]; then
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr --non-interactive --agree-tos -m info@drugalert.gr
fi

# Create cron job for scraper
echo "14. Setting up cron job for scraper..."
(crontab -l 2>/dev/null; echo "*/15 * * * * cd /root/eof-scraper/backend && /root/eof-scraper/backend/venv/bin/python main.py >> /var/log/drugalert-scraper.log 2>&1") | crontab -

# Final status check
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Checking service status..."
systemctl status drugalert-backend --no-pager
echo ""
pm2 status
echo ""
echo "Testing API endpoint..."
curl -s http://localhost:8443/api/health || echo "API not responding yet, check logs with: journalctl -u drugalert-backend -n 50"
echo ""
echo "Your site should be available at:"
echo "- https://drugalert.gr"
echo "- API: https://drugalert.gr/api"
echo ""
echo "Configuration saved in:"
echo "- Backend: /root/eof-scraper/backend/.env"
echo "- Frontend: /root/eof-scraper/frontend/.env.production.local"
echo ""
echo "To check logs:"
echo "- Backend: journalctl -u drugalert-backend -f"
echo "- Frontend: pm2 logs drugalert-frontend"
echo "- Scraper: tail -f /var/log/drugalert-scraper.log"
