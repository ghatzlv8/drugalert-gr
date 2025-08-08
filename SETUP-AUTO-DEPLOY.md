# 🚀 Automatic Deployment Setup Guide

This guide will help you set up automatic deployment from GitHub to your Hetzner server.

## Prerequisites

- Your DrugAlert.gr server is already running on Hetzner
- You have SSH access to the server
- You have admin access to the GitHub repository

## Step 1: Generate SSH Key for GitHub Actions

First, create a dedicated SSH key for GitHub Actions on your **local machine**:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/github-actions-deploy -C "github-actions"

# Display the private key (you'll need this for GitHub)
cat ~/.ssh/github-actions-deploy

# Display the public key (you'll need this for the server)
cat ~/.ssh/github-actions-deploy.pub
```

## Step 2: Add Public Key to Server

Connect to your server and add the public key:

```bash
# Connect to server
ssh root@drugalert.gr

# Add the public key to authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository: https://github.com/ghatzlv8/drugalert-gr
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

### SERVER_HOST
- Name: `SERVER_HOST`
- Value: `drugalert.gr` (or your server IP)

### SERVER_USER
- Name: `SERVER_USER`
- Value: `root`

### SERVER_SSH_KEY
- Name: `SERVER_SSH_KEY`
- Value: (paste the entire private key from step 1, including the BEGIN and END lines)

## Step 4: Test the Setup

1. Make a small change to any file
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub to watch the deployment

## How It Works

Every time you push to the `main` branch:
1. GitHub Actions will automatically connect to your server
2. Pull the latest code
3. Install/update dependencies
4. Build the frontend
5. Restart all services

## Manual Deployment

You can also trigger deployment manually:
1. Go to **Actions** tab
2. Select **Deploy to Hetzner**
3. Click **Run workflow**

## Troubleshooting

### Permission Denied
- Make sure the SSH key is correctly added to the server
- Check that the GitHub secrets are properly set

### Services Not Restarting
- Check service names on your server:
  ```bash
  systemctl list-units | grep drugalert
  pm2 list
  ```

### Build Failures
- Check server logs:
  ```bash
  journalctl -u drugalert-api -n 50
  pm2 logs
  ```

## Security Notes

- The SSH key is only used for deployment
- Consider creating a dedicated deployment user instead of using root
- Regularly rotate SSH keys for security

## Success! 🎉

Your automatic deployment is now set up. Every push to `main` will automatically deploy to your live server!
