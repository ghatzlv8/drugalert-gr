#!/bin/bash

echo "🔧 Fixing HTTPS configuration..."

# Create new nginx config
cat > /tmp/nginx-drugalert.conf << 'EOF'
# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name drugalert.gr www.drugalert.gr;
    return 301 https://$server_name$request_uri;
}

# HTTPS Frontend
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    
    server_name drugalert.gr www.drugalert.gr;
    
    ssl_certificate /etc/letsencrypt/live/drugalert.gr-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drugalert.gr-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
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

# API on port 8000
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS API on port 8443
server {
    listen 8443 ssl;
    listen [::]:8443 ssl;
    
    server_name drugalert.gr www.drugalert.gr;
    
    ssl_certificate /etc/letsencrypt/live/drugalert.gr-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/drugalert.gr-0001/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Copy to server and apply
scp /tmp/nginx-drugalert.conf root@188.245.198.35:/etc/nginx/sites-available/drugalert
ssh root@188.245.198.35 "rm -f /etc/nginx/sites-enabled/default && ln -sf /etc/nginx/sites-available/drugalert /etc/nginx/sites-enabled/ && nginx -t && systemctl restart nginx"

echo "✅ HTTPS configuration fixed!"
echo "Your site is now available at:"
echo "  - https://drugalert.gr"
echo "  - https://www.drugalert.gr"
echo "  - API: https://drugalert.gr:8443"
