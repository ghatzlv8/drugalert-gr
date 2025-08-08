#!/bin/bash
# Simple deploy script - just run ./deploy-now.sh
echo "🚀 Deploying to drugalert.gr..."
ssh root@drugalert.gr 'cd /var/www/drugalert && git pull && cd frontend && npm install && npm run build && pm2 restart all && echo "✅ Deployed!"' || echo "❌ Deploy failed"
