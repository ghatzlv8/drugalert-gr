#!/bin/bash

# DrugAlert.gr Server Deployment Script

echo "Deploying to DrugAlert.gr server..."
echo "Please run the following commands on the server:"
echo ""
echo "1. SSH into the server:"
echo "   ssh root@195.201.195.43"
echo ""
echo "2. Run these commands:"
echo "   cd /root/drugalert-app"
echo "   git pull"
echo "   npm run build --prefix frontend"
echo "   pm2 restart drugalert-frontend"
echo "   systemctl restart drugalert-api"
echo ""
echo "3. Verify deployment:"
echo "   pm2 status"
echo "   systemctl status drugalert-api"
echo ""
echo "The share functionality has been added to the alerts page!"
echo "Users can now click 'Κοινοποίηση' (Share) to invite friends via email."
