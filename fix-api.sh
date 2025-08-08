#!/bin/bash

echo "🔧 API Fix Instructions"
echo "======================"
echo ""
echo "The API is not running. To fix it:"
echo ""
echo "1. Go to: https://console.hetzner.cloud/"
echo "2. Click your server → Console button"
echo "3. Login as root"
echo "4. Run these commands:"
echo ""
echo "# Check if API is running"
echo "systemctl status drugalert-api"
echo ""
echo "# If not running, start it:"
echo "cd /opt/drugalert.gr || cd /var/www/drugalert"
echo "source venv/bin/activate"
echo "python api_combined.py &"
echo ""
echo "# Or restart the service:"
echo "systemctl restart drugalert-api"
echo ""
echo "# Check logs if there are errors:"
echo "journalctl -u drugalert-api -n 50"
echo ""
echo "# Make sure port 5000 is used by the API:"
echo "lsof -i :5000"
echo ""
echo "# If nothing works, run API manually:"
echo "cd /opt/drugalert.gr"
echo "source venv/bin/activate" 
echo "python api_combined.py"

# Keep trying SSH
echo ""
echo "🔄 Trying to connect via SSH..."
while true; do
    ssh -o ConnectTimeout=5 root@188.245.198.35 '
        echo "Connected! Starting API..."
        cd /opt/drugalert.gr || cd /var/www/drugalert
        systemctl restart drugalert-api || {
            source venv/bin/activate
            nohup python api_combined.py > api.log 2>&1 &
        }
        echo "API should be running now!"
    ' 2>/dev/null && {
        echo "✅ Fixed!"
        break
    }
    echo -n "."
    sleep 10
done
