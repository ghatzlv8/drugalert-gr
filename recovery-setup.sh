#!/bin/bash

echo "=== Recovery Setup Script ==="
echo "Continuing setup from where it stopped..."
echo ""

# Check what exists
echo "Checking current state..."
if [ -d "/root/eof-scraper" ]; then
    echo "✓ Repository exists"
else
    echo "✗ Repository missing, cloning..."
    cd /root
    git clone https://github.com/ghatzlv8/drugalert-gr.git eof-scraper
fi

# Setup backend if not running
echo ""
echo "Setting up backend..."
cd /root/eof-scraper/backend

# Create venv if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate and install dependencies
source venv/bin/activate
pip install -r requirements.txt

# Check if .env exists, if not create it
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://drugalert_user:DrugAlert2024!@localhost/drugalert_db
SECRET_KEY=your-very-secret-key-here-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
VAPID_PRIVATE_KEY=MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgJRjOupKQmkNfBCdGWWj3W9YQZU6xUd7G8aJnz6BHpoWhRANCAARKV5SDLLaccXDEAl1uGWWZ8nLnFzetaSInqT3TdlqQQpfg+AY6xNhgJjDFHS2u1PoIWQgLQ7Y6LXkqbVCJFJue
VAPID_PUBLIC_KEY=04ca5794832cb69c7170c4025d6e196599f272e7173b5a6d2227a93dd3765a904297fe018eb134d8602630c51d2daed4fa0859080b43b63a2d792a6d5089149b9e
VAPID_EMAIL=info@drugalert.gr
EOF
fi

# Start backend in background
echo "Starting backend API..."
pkill -f "uvicorn api:app"  # Kill any existing process
nohup python -m uvicorn api:app --host 0.0.0.0 --port 8443 > /var/log/drugalert-backend.log 2>&1 &
echo "Backend started with PID: $!"

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo ""
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Setup frontend
echo ""
echo "Setting up frontend..."
cd /root/eof-scraper/frontend

# Create production env file
cat > .env.production.local << 'EOF'
NEXT_PUBLIC_API_URL=https://drugalert.gr/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=04ca5794832cb69c7170c4025d6e196599f272e7173b5a6d2227a93dd3765a904297fe018eb134d8602630c51d2daed4fa0859080b43b63a2d792a6d508914
EOF

# Install dependencies and build
echo "Installing frontend dependencies..."
npm install

echo "Building frontend..."
npm run build

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Start frontend with PM2
echo "Starting frontend..."
pm2 stop drugalert-frontend 2>/dev/null || true
pm2 delete drugalert-frontend 2>/dev/null || true
pm2 start npm --name "drugalert-frontend" -- start
pm2 save
pm2 startup systemd -u root --hp /root | grep "sudo" | bash

# Configure Nginx
echo ""
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/default << 'NGINX_EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name drugalert.gr www.drugalert.gr api.drugalert.gr 188.245.198.35;

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
NGINX_EOF

# Restart Nginx
systemctl restart nginx

# Configure firewall
echo ""
echo "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8443/tcp
echo "y" | ufw enable

# Final checks
echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Checking services..."
echo ""
echo "Backend API:"
curl -s http://localhost:8443/api/health && echo " ✓ API is running" || echo " ✗ API not responding"
echo ""
echo "Frontend:"
curl -s http://localhost:3000 > /dev/null && echo " ✓ Frontend is running" || echo " ✗ Frontend not responding"
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Your site should be accessible at:"
echo "- http://drugalert.gr"
echo "- http://188.245.198.35"
echo ""
echo "To add SSL later, run:"
echo "apt-get install -y certbot python3-certbot-nginx"
echo "certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr"
echo ""
echo "Logs:"
echo "- Backend: tail -f /var/log/drugalert-backend.log"
echo "- Frontend: pm2 logs drugalert-frontend"
