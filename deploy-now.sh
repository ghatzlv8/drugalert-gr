#!/bin/bash
# Simple deploy script - just run ./deploy-now.sh
echo "🚀 Deploying to drugalert.gr..."
ssh root@188.245.198.35 'cd /root/eof-scraper && git pull && cd frontend && npm install && npm run build && pm2 restart all && echo "✅ Deployed!"' || echo "❌ Deploy failed"
