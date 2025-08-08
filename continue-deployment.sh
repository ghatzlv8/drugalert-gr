#!/bin/bash

# Continue DrugAlert.gr deployment on Hetzner Cloud
# This script continues from where the initial deployment left off

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[i] Continuing DrugAlert.gr deployment...${NC}"

# Check if repository is accessible
echo -e "${BLUE}[i] Checking repository accessibility...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://github.com/ghatzlv8/drugalert-gr | grep -q "200"; then
    echo -e "${GREEN}[✓] Repository is accessible${NC}"
else
    echo -e "${RED}[✗] Repository is not accessible. Please make it public first.${NC}"
    exit 1
fi

# Clone the repository
echo -e "${BLUE}[i] Cloning repository...${NC}"
cd /opt
if [ ! -d "drugalert.gr" ]; then
    git clone https://github.com/ghatzlv8/drugalert-gr.git drugalert.gr
    echo -e "${GREEN}[✓] Repository cloned${NC}"
else
    echo -e "${GREEN}[✓] Repository already exists${NC}"
fi

cd drugalert.gr

# Set up PostgreSQL database
echo -e "${BLUE}[i] Setting up PostgreSQL database...${NC}"
DB_PASS=$(openssl rand -base64 32)
sudo -u postgres psql <<EOF
CREATE DATABASE drugalert_db;
CREATE USER drugalert_user WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE drugalert_db TO drugalert_user;
ALTER DATABASE drugalert_db OWNER TO drugalert_user;
EOF
echo -e "${GREEN}[✓] PostgreSQL database created${NC}"

# Set up Python virtual environment for backend
echo -e "${BLUE}[i] Setting up Python backend...${NC}"
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Generate VAPID keys
echo -e "${BLUE}[i] Generating VAPID keys...${NC}"
VAPID_KEYS=$(python3 -c "from py_vapid import Vapid; vapid = Vapid(); vapid.generate_keys(); import json; print(json.dumps({'public': vapid.public_key.public_bytes_raw().hex(), 'private': vapid.private_key.private_bytes_raw().hex()}))")
VAPID_PUBLIC=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['public'])")
VAPID_PRIVATE=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['private'])")

# Create backend .env file
cat > .env <<EOF
# Database
DATABASE_URL=postgresql://drugalert_user:$DB_PASS@localhost/drugalert_db

# Security
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Email (update these with your email settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# Frontend URL
FRONTEND_URL=https://drugalert.gr

# Push Notifications
VAPID_PUBLIC_KEY=$VAPID_PUBLIC
VAPID_PRIVATE_KEY=$VAPID_PRIVATE
VAPID_CLAIM_EMAIL=mailto:admin@drugalert.gr

# Stripe (update these with your Stripe keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
EOF

# Run database migrations
echo -e "${BLUE}[i] Running database migrations...${NC}"
python manage.py migrate
echo -e "${GREEN}[✓] Database migrations completed${NC}"

deactivate
cd ..

# Set up frontend
echo -e "${BLUE}[i] Setting up frontend...${NC}"
cd frontend

# Create frontend .env file
cat > .env <<EOF
REACT_APP_API_URL=https://api.drugalert.gr
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
REACT_APP_VAPID_PUBLIC_KEY=$VAPID_PUBLIC
EOF

# Install dependencies and build
npm install
npm run build
echo -e "${GREEN}[✓] Frontend built${NC}"

cd ..

# Create systemd service for backend
echo -e "${BLUE}[i] Creating backend systemd service...${NC}"
cat > /etc/systemd/system/drugalert-backend.service <<EOF
[Unit]
Description=DrugAlert Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/drugalert.gr/backend
Environment="PATH=/opt/drugalert.gr/backend/venv/bin"
ExecStart=/opt/drugalert.gr/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable drugalert-backend
systemctl start drugalert-backend
echo -e "${GREEN}[✓] Backend service created and started${NC}"

# Set up PM2 for frontend
echo -e "${BLUE}[i] Setting up PM2 for frontend...${NC}"
npm install -g pm2 serve
cd frontend
pm2 start --name drugalert-frontend "serve -s build -l 3000"
pm2 save
pm2 startup systemd -u root --hp /root
echo -e "${GREEN}[✓] PM2 configured for frontend${NC}"

# Configure Nginx
echo -e "${BLUE}[i] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/drugalert <<'EOF'
# Backend API
server {
    listen 80;
    server_name api.drugalert.gr;
    
    location / {
        proxy_pass http://localhost:8000;
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

# Frontend
server {
    listen 80;
    server_name drugalert.gr www.drugalert.gr;
    
    location / {
        proxy_pass http://localhost:3000;
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
EOF

ln -sf /etc/nginx/sites-available/drugalert /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo -e "${GREEN}[✓] Nginx configured${NC}"

# Set up cron jobs
echo -e "${BLUE}[i] Setting up cron jobs...${NC}"
(crontab -l 2>/dev/null || true; echo "*/15 * * * * cd /opt/drugalert.gr/backend && /opt/drugalert.gr/backend/venv/bin/python scraper.py >> /var/log/drugalert-scraper.log 2>&1") | crontab -
(crontab -l 2>/dev/null || true; echo "0 2 * * * pg_dump -U drugalert_user drugalert_db > /opt/backups/drugalert_db_\$(date +\%Y\%m\%d_\%H\%M\%S).sql") | crontab -
mkdir -p /opt/backups
echo -e "${GREEN}[✓] Cron jobs configured${NC}"

# Save configuration
echo -e "${BLUE}[i] Saving configuration...${NC}"
cat > /root/drugalert-config.txt <<EOF
DrugAlert.gr Deployment Configuration
=====================================
Date: $(date)
Server IP: $(curl -s ifconfig.me)

Database:
- Name: drugalert_db
- User: drugalert_user
- Password: $DB_PASS

VAPID Keys:
- Public: $VAPID_PUBLIC
- Private: $VAPID_PRIVATE

Services:
- Backend: http://localhost:8000 (systemctl status drugalert-backend)
- Frontend: http://localhost:3000 (pm2 status)
- Nginx: (systemctl status nginx)

Important Files:
- Backend .env: /opt/drugalert.gr/backend/.env
- Frontend .env: /opt/drugalert.gr/frontend/.env
- Nginx config: /etc/nginx/sites-available/drugalert

Next Steps:
1. Update DNS records for drugalert.gr and api.drugalert.gr to point to $(curl -s ifconfig.me)
2. Run: certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr
3. Update Stripe keys in backend and frontend .env files
4. Update email settings in backend .env file
5. Restart services: systemctl restart drugalert-backend && pm2 restart drugalert-frontend
EOF

echo -e "${GREEN}[✓] Configuration saved to /root/drugalert-config.txt${NC}"

# Display status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Service Status:${NC}"
systemctl status drugalert-backend --no-pager | head -5
echo ""
pm2 status
echo ""
systemctl status nginx --no-pager | head -5

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update your DNS records:"
echo "   - drugalert.gr → $(curl -s ifconfig.me)"
echo "   - www.drugalert.gr → $(curl -s ifconfig.me)"
echo "   - api.drugalert.gr → $(curl -s ifconfig.me)"
echo ""
echo "2. Once DNS is updated, run:"
echo "   certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr"
echo ""
echo "3. Update configuration files with your actual API keys"
echo "4. Restart services after updating configuration"
echo ""
echo -e "${GREEN}Configuration details saved in: /root/drugalert-config.txt${NC}"
