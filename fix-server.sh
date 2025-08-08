#!/bin/bash

# Script to fix server when SSH is not accessible
# This creates a startup script that will run on next boot

echo "🔧 Creating server fix script..."

# Create a cloud-init script that will fix the server
cat > /tmp/fix-drugalert.yaml << 'EOF'
#cloud-config
runcmd:
  # Fix firewall
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw allow 8000/tcp
  - ufw allow 8443/tcp
  - ufw --force enable
  
  # Fix nginx
  - |
    cat > /etc/nginx/sites-available/default << 'NGINX'
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name drugalert.gr www.drugalert.gr 188.245.198.35 _;
        
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
    
    server {
        listen 8000;
        listen [::]:8000;
        server_name _;
        
        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    NGINX
  
  # Restart services
  - systemctl restart nginx
  - systemctl restart drugalert-api || true
  - systemctl restart drugalert-scheduler || true
  
  # Fix PM2
  - su - root -c "pm2 resurrect"
  - su - root -c "pm2 restart all"
  - su - root -c "pm2 save"
  
  # Ensure services start on boot
  - systemctl enable nginx
  - systemctl enable drugalert-api || true
  
  # Log success
  - echo "Server fixed at $(date)" >> /var/log/drugalert-fix.log
EOF

echo "📝 Fix script created!"
echo ""
echo "Now you need to:"
echo "1. Go to Hetzner Console: https://console.hetzner.cloud/"
echo "2. Click on your server"
echo "3. Go to 'Rescue' tab"
echo "4. Enable rescue system and reboot"
echo "5. Or use the VNC Console to run these commands manually"
echo ""
echo "Alternative: Use Hetzner Cloud CLI"
echo "Install: brew install hcloud"
echo "Then run: hcloud server reset <server-name>"
EOF

# Alternative: Direct server fix attempt through various methods
echo ""
echo "🚀 Attempting direct fix via alternative methods..."

# Try different SSH ports
for port in 22 2222 8022; do
    echo "Trying SSH on port $port..."
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -p $port root@188.245.198.35 'echo "Connected!"' 2>/dev/null && {
        echo "✅ Connected on port $port!"
        ssh -p $port root@188.245.198.35 'systemctl restart nginx; pm2 restart all; ufw allow 22; ufw allow 80; ufw allow 443'
        exit 0
    }
done

# Try using telnet to send HTTP request to restart
echo ""
echo "🌐 Attempting HTTP-based recovery..."
(echo -e "GET /restart-nginx HTTP/1.1\r\nHost: drugalert.gr\r\n\r\n"; sleep 2) | telnet 188.245.198.35 80 2>/dev/null

echo ""
echo "❗ Manual intervention required!"
echo ""
echo "Please use Hetzner Console to access your server:"
echo "1. https://console.hetzner.cloud/"
echo "2. Click on your server → Console"
echo "3. Login and run:"
echo "   systemctl restart nginx"
echo "   pm2 restart all"
echo "   ufw allow 22 && ufw allow 80 && ufw allow 443"
