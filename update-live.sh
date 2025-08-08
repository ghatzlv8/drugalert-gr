#!/bin/bash

# Update script for DrugAlert.gr on Hetzner server
# This updates an existing deployment with the latest code

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if SSH details are provided
if [ "$#" -lt 1 ]; then
    echo "Usage: ./update-live.sh <server-ip-or-hostname> [ssh-user]"
    echo "Example: ./update-live.sh drugalert.gr root"
    exit 1
fi

SERVER=$1
SSH_USER=${2:-root}

print_info "Updating DrugAlert.gr on $SERVER..."

# Create a deployment script to run on the server
cat > /tmp/update-drugalert.sh << 'EOF'
#!/bin/bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}[i] Starting update process...${NC}"

# Navigate to the app directory
cd /var/www/drugalert || cd /opt/drugalert.gr || { echo "Could not find app directory"; exit 1; }

# Pull latest code
echo -e "${BLUE}[i] Pulling latest code from GitHub...${NC}"
git fetch origin
git reset --hard origin/main

# Update Python dependencies
echo -e "${BLUE}[i] Updating Python dependencies...${NC}"
source venv/bin/activate
pip install -r requirements.txt

# Update and build frontend
echo -e "${BLUE}[i] Building frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Set correct permissions
chown -R www-data:www-data /var/www/drugalert 2>/dev/null || chown -R www-data:www-data /opt/drugalert.gr 2>/dev/null || true

# Restart services
echo -e "${BLUE}[i] Restarting services...${NC}"
systemctl restart drugalert-api || systemctl restart drugalert-backend || true
systemctl restart drugalert-scheduler || true

# Restart PM2 for frontend
pm2 restart drugalert-frontend || pm2 restart all || true
pm2 save

# Reload nginx
nginx -t && systemctl reload nginx

echo -e "${GREEN}[✓] Update completed successfully!${NC}"
echo ""
echo "Services status:"
systemctl status drugalert-api --no-pager | head -5 || systemctl status drugalert-backend --no-pager | head -5 || true
echo ""
pm2 status
EOF

# Copy and execute the script on the server
print_status "Copying update script to server..."
scp /tmp/update-drugalert.sh ${SSH_USER}@${SERVER}:/tmp/

print_status "Running update on server..."
ssh ${SSH_USER}@${SERVER} "chmod +x /tmp/update-drugalert.sh && /tmp/update-drugalert.sh"

# Clean up
rm /tmp/update-drugalert.sh

print_info "Update complete!"
print_info "Your site should now be running the latest code at https://drugalert.gr"
