#!/bin/bash

# Automated deployment setup script for DrugAlert.gr
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Setting up automatic deployment for DrugAlert.gr${NC}\n"

# Step 1: Add public key to server
echo -e "${BLUE}[1/4] Adding SSH key to server...${NC}"
PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMxM3vZtDCRPKm9vHul3/OH/m5oORoOcq6Taidp4WCT0 github-actions"

ssh root@drugalert.gr "mkdir -p ~/.ssh && echo '$PUBLIC_KEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh" 2>/dev/null || {
    echo -e "${YELLOW}Note: Could not add SSH key automatically. You may need to add it manually.${NC}"
}

# Step 2: Deploy current changes first
echo -e "\n${BLUE}[2/4] Deploying current changes to server...${NC}"
cat > /tmp/deploy-now.sh << 'EOF'
#!/bin/bash
cd /var/www/drugalert || cd /opt/drugalert.gr || exit 1
git fetch origin
git reset --hard origin/main
source venv/bin/activate
pip install -r requirements.txt
cd frontend
npm install
npm run build
cd ..
chown -R www-data:www-data .
systemctl restart drugalert-api || systemctl restart drugalert-backend || true
pm2 restart drugalert-frontend || pm2 restart all || true
nginx -t && systemctl reload nginx
echo "Deployment completed!"
EOF

ssh root@drugalert.gr 'bash -s' < /tmp/deploy-now.sh
rm /tmp/deploy-now.sh

# Step 3: Create GitHub CLI command to add secrets
echo -e "\n${BLUE}[3/4] Setting up GitHub secrets...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}GitHub CLI not installed. Installing...${NC}"
    brew install gh 2>/dev/null || {
        echo "Please install GitHub CLI manually: https://cli.github.com/"
        exit 1
    }
fi

# Login to GitHub if needed
gh auth status &>/dev/null || {
    echo -e "${YELLOW}Please login to GitHub:${NC}"
    gh auth login
}

# Add secrets
echo -e "${GREEN}Adding GitHub secrets...${NC}"
PRIVATE_KEY=$(cat ~/.ssh/github-actions-deploy)

gh secret set SERVER_HOST --body="drugalert.gr" --repo=ghatzlv8/drugalert-gr
gh secret set SERVER_USER --body="root" --repo=ghatzlv8/drugalert-gr
gh secret set SERVER_SSH_KEY --body="$PRIVATE_KEY" --repo=ghatzlv8/drugalert-gr

# Step 4: Add workflow file via GitHub API
echo -e "\n${BLUE}[4/4] Creating GitHub Actions workflow...${NC}"

WORKFLOW_CONTENT=$(base64 <<'EOF'
name: Deploy to Hetzner

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /var/www/drugalert || cd /opt/drugalert.gr || exit 1
          git fetch origin
          git reset --hard origin/main
          source venv/bin/activate
          pip install -r requirements.txt
          cd frontend
          npm install
          npm run build
          cd ..
          chown -R www-data:www-data .
          systemctl restart drugalert-api || systemctl restart drugalert-backend || true
          systemctl restart drugalert-scheduler || true
          pm2 restart drugalert-frontend || pm2 restart all || true
          pm2 save
          nginx -t && systemctl reload nginx
          echo "Deployment completed successfully!"
EOF
)

# Create workflow using GitHub API
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/ghatzlv8/drugalert-gr/contents/.github/workflows/deploy.yml \
  -f message="Add automatic deployment workflow" \
  -f content="$WORKFLOW_CONTENT" \
  -f branch="main" || {
    echo -e "${YELLOW}Could not create workflow automatically. Please create it manually.${NC}"
}

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}Your site is now deployed and automatic deployment is configured.${NC}"
echo -e "${GREEN}Every push to 'main' branch will automatically deploy to your server.${NC}"
echo -e "\nYour site is live at: ${BLUE}https://drugalert.gr${NC}"
