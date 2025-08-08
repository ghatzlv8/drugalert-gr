#!/bin/bash

echo "🚨 Emergency Server Recovery Script"
echo "=================================="

# Check if hcloud is installed
if ! command -v hcloud &> /dev/null; then
    echo "Installing Hetzner Cloud CLI..."
    brew install hcloud 2>/dev/null || {
        echo "❌ Please install hcloud manually:"
        echo "   brew install hcloud"
        echo "   or download from: https://github.com/hetznercloud/cli"
        exit 1
    }
fi

# Simple recovery using console commands
echo ""
echo "🔧 Attempting recovery through various methods..."

# Method 1: Try SSH with different timeouts and methods
echo "Method 1: Trying SSH variants..."
for i in {1..3}; do
    echo -n "  Attempt $i... "
    ssh -o ConnectTimeout=20 -o ServerAliveInterval=5 -o ServerAliveCountMax=2 root@188.245.198.35 '
        echo "Connected! Fixing server..."
        systemctl restart nginx
        systemctl restart drugalert-api
        pm2 restart all
        ufw allow 22/tcp
        ufw allow 80/tcp  
        ufw allow 443/tcp
        ufw --force enable
        echo "Fixed!"
    ' 2>/dev/null && { echo "✅ Success!"; exit 0; } || echo "❌ Failed"
    sleep 2
done

# Method 2: Port scan to see what's open
echo ""
echo "Method 2: Checking open ports..."
for port in 22 80 443 8000 8443; do
    nc -w 2 -z 188.245.198.35 $port 2>/dev/null && echo "  ✅ Port $port is open" || echo "  ❌ Port $port is closed"
done

# Method 3: Try to trigger auto-recovery
echo ""
echo "Method 3: Triggering recovery mechanisms..."

# Send wake-up packets
ping -c 10 188.245.198.35 > /dev/null 2>&1 &

# Wait a bit
echo "  Waiting for server to respond..."
sleep 10

# Final check
echo ""
echo "📊 Final status check:"
curl -I -m 5 http://drugalert.gr 2>&1 | grep -E "HTTP|Connected" && {
    echo "✅ Server is responding!"
    exit 0
} || {
    echo "❌ Server still not responding"
}

echo ""
echo "🛠️ MANUAL RECOVERY REQUIRED"
echo "========================="
echo ""
echo "Option 1: Hetzner Console (Recommended)"
echo "  1. Go to: https://console.hetzner.cloud/"
echo "  2. Click your server → 'Console' button"
echo "  3. Login with root password"
echo "  4. Run these commands:"
echo ""
echo "     systemctl stop nginx"
echo "     systemctl stop drugalert-api"
echo "     pm2 stop all"
echo "     "
echo "     # Fix nginx config"
echo "     cat > /etc/nginx/sites-available/default << 'EOF'"
echo "     server {"
echo "         listen 80 default_server;"
echo "         server_name _;"
echo "         location / {"
echo "             proxy_pass http://localhost:3000;"
echo "             proxy_set_header Host \$host;"
echo "         }"
echo "     }"
echo "     EOF"
echo "     "
echo "     ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/"
echo "     nginx -t"
echo "     systemctl start nginx"
echo "     cd /opt/drugalert.gr || cd /var/www/drugalert"
echo "     pm2 start all"
echo "     systemctl start drugalert-api"
echo ""
echo "Option 2: Hard Reboot"
echo "  In Hetzner Console → Power → 'Reset' (hard reboot)"
echo ""
echo "After recovery, your site will be available at:"
echo "  http://drugalert.gr"
echo "  http://188.245.198.35"
