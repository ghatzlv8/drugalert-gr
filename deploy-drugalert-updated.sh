#!/bin/bash

# Deploy DrugAlert.gr on Hetzner Cloud - Updated for actual repo structure
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[i] Deploying DrugAlert.gr...${NC}"

# Change to the cloned repository
cd /opt/drugalert.gr

# Set up PostgreSQL database (if not already done)
echo -e "${BLUE}[i] Setting up PostgreSQL database...${NC}"
DB_PASS=$(openssl rand -base64 32)

# Check if database exists
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw drugalert_db; then
    echo -e "${GREEN}[✓] Database already exists${NC}"
    # Get existing password from .env if it exists
    if [ -f .env ]; then
        DB_PASS=$(grep DATABASE_URL .env | sed 's/.*:\/\/drugalert_user:\(.*\)@localhost.*/\1/')
    fi
else
    sudo -u postgres psql <<EOF
CREATE DATABASE drugalert_db;
CREATE USER drugalert_user WITH ENCRYPTED PASSWORD '$DB_PASS';
GRANT ALL PRIVILEGES ON DATABASE drugalert_db TO drugalert_user;
ALTER DATABASE drugalert_db OWNER TO drugalert_user;
\q
EOF
    echo -e "${GREEN}[✓] PostgreSQL database created${NC}"
fi

# Grant permissions on public schema
sudo -u postgres psql -d drugalert_db <<EOF
GRANT ALL ON SCHEMA public TO drugalert_user;
\q
EOF

# Set up Python virtual environment
echo -e "${BLUE}[i] Setting up Python environment...${NC}"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Generate VAPID keys
echo -e "${BLUE}[i] Generating VAPID keys...${NC}"
pip install py-vapid
VAPID_KEYS=$(python3 -c "from py_vapid import Vapid; vapid = Vapid(); vapid.generate_keys(); import json; print(json.dumps({'public': vapid.public_key.public_bytes_raw().hex(), 'private': vapid.private_key.private_bytes_raw().hex()}))")
VAPID_PUBLIC=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['public'])")
VAPID_PRIVATE=$(echo $VAPID_KEYS | python3 -c "import sys, json; print(json.loads(sys.stdin.read())['private'])")

# Create .env file from example
echo -e "${BLUE}[i] Creating .env file...${NC}"
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

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key
EOF

# Run database migrations
echo -e "${BLUE}[i] Setting up database tables...${NC}"
# Check if migrations directory has any migration scripts
if [ -d "migrations" ] && [ "$(ls -A migrations/*.py 2>/dev/null)" ]; then
    for migration in migrations/*.py; do
        echo "Running migration: $migration"
        python $migration
    done
else
    echo "No migrations found, database will be initialized on first run"
fi

deactivate

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

# Create systemd service for backend API
echo -e "${BLUE}[i] Creating backend API service...${NC}"
cat > /etc/systemd/system/drugalert-api.service <<EOF
[Unit]
Description=DrugAlert API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/drugalert.gr
Environment="PATH=/opt/drugalert.gr/venv/bin"
ExecStart=/opt/drugalert.gr/venv/bin/python api_combined.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for scheduler
echo -e "${BLUE}[i] Creating scheduler service...${NC}"
cat > /etc/systemd/system/drugalert-scheduler.service <<EOF
[Unit]
Description=DrugAlert Scheduler
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/drugalert.gr
Environment="PATH=/opt/drugalert.gr/venv/bin"
ExecStart=/opt/drugalert.gr/venv/bin/python scheduler.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable drugalert-api drugalert-scheduler
systemctl start drugalert-api drugalert-scheduler
echo -e "${GREEN}[✓] Backend services created and started${NC}"

# Set up PM2 for frontend
echo -e "${BLUE}[i] Setting up PM2 for frontend...${NC}"
npm install -g pm2 serve
cd frontend
pm2 start --name drugalert-frontend "serve -s build -l 3000"
pm2 save
pm2 startup systemd -u root --hp /root
cd ..
echo -e "${GREEN}[✓] PM2 configured for frontend${NC}"

# Configure Nginx
echo -e "${BLUE}[i] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/drugalert <<'EOF'
# Backend API
server {
    listen 80;
    server_name api.drugalert.gr;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
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

# Create backup directory
mkdir -p /opt/backups

# Save configuration
echo -e "${BLUE}[i] Saving configuration...${NC}"
SERVER_IP=$(curl -s ifconfig.me)
cat > /root/drugalert-config.txt <<EOF
DrugAlert.gr Deployment Configuration
=====================================
Date: $(date)
Server IP: $SERVER_IP

Database:
- Name: drugalert_db
- User: drugalert_user
- Password: $DB_PASS

VAPID Keys:
- Public: $VAPID_PUBLIC
- Private: $VAPID_PRIVATE

Services:
- API: http://localhost:5000 (systemctl status drugalert-api)
- Scheduler: (systemctl status drugalert-scheduler)
- Frontend: http://localhost:3000 (pm2 status)
- Nginx: (systemctl status nginx)

Important Files:
- Backend .env: /opt/drugalert.gr/.env
- Frontend .env: /opt/drugalert.gr/frontend/.env
- Nginx config: /etc/nginx/sites-available/drugalert

Next Steps:
1. Update DNS records:
   - drugalert.gr → $SERVER_IP
   - www.drugalert.gr → $SERVER_IP
   - api.drugalert.gr → $SERVER_IP

2. Once DNS is propagated, run:
   certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr

3. Update API keys in .env files:
   - Stripe keys (backend and frontend)
   - Email credentials (backend)
   - OpenAI key if using (backend)

4. Restart services after updating configuration:
   systemctl restart drugalert-api drugalert-scheduler
   pm2 restart drugalert-frontend
EOF

echo -e "${GREEN}[✓] Configuration saved to /root/drugalert-config.txt${NC}"

# Display status
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Service Status:${NC}"
systemctl status drugalert-api --no-pager | head -5
echo ""
systemctl status drugalert-scheduler --no-pager | head -5
echo ""
pm2 status
echo ""
systemctl status nginx --no-pager | head -5

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update your DNS records:"
echo "   - drugalert.gr → $SERVER_IP"
echo "   - www.drugalert.gr → $SERVER_IP"
echo "   - api.drugalert.gr → $SERVER_IP"
echo ""
echo "2. Once DNS is updated, run:"
echo "   certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr"
echo ""
echo "3. Update configuration files with your actual API keys"
echo "4. Restart services after updating configuration"
echo ""
echo -e "${GREEN}Configuration details saved in: /root/drugalert-config.txt${NC}"
