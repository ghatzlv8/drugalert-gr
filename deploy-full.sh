#!/bin/bash

echo "Full deployment script for DrugAlert.gr"
echo "======================================="

# SSH into server and run deployment
ssh root@drugalert.gr << 'EOF'
cd /opt/drugalert.gr

echo "1. Pulling latest code from Git..."
git pull origin main

echo "2. Installing/updating Python dependencies..."
./venv/bin/pip install -r requirements.txt

echo "3. Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "4. Restarting API service..."
# Kill existing API process
pkill -f "api_combined.py" || true
sleep 2

# Start API in background
nohup ./venv/bin/python api_combined.py > logs/api.log 2>&1 &
echo "API started with PID: $!"

echo "5. Restarting scheduler..."
# Kill existing scheduler process  
pkill -f "scheduler.py" || true
sleep 2

# Start scheduler in background
nohup ./venv/bin/python scheduler.py > logs/scheduler.log 2>&1 &
echo "Scheduler started with PID: $!"

echo "6. Reloading nginx..."
systemctl reload nginx

echo "7. Checking services..."
sleep 3
ps aux | grep -E "(api_combined|scheduler)" | grep -v grep

echo "Deployment complete!"
echo "Site should be available at: https://drugalert.gr"
EOF
