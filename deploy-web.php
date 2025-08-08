<?php
// Simple deployment script
// Place this on your server and access via web browser

$secret = 'your-secret-key-here';
$provided_secret = $_GET['secret'] ?? '';

if ($provided_secret !== $secret) {
    die('Unauthorized');
}

echo "<pre>";
echo "Starting deployment...\n\n";

// Pull latest code
echo "Pulling latest code from GitHub...\n";
echo shell_exec('cd /root/eof-scraper && git pull origin main 2>&1');

// Backend deployment
echo "\n\nDeploying backend...\n";
echo shell_exec('cd /root/eof-scraper/backend && source venv/bin/activate && pip install -r requirements.txt 2>&1');
echo shell_exec('pkill -f "uvicorn api:app" || true');
echo shell_exec('cd /root/eof-scraper/backend && source venv/bin/activate && nohup python -m uvicorn api:app --host 0.0.0.0 --port 8443 > /var/log/drugalert-backend.log 2>&1 &');

// Frontend deployment
echo "\n\nDeploying frontend...\n";
echo shell_exec('cd /root/eof-scraper/frontend && npm install 2>&1');
echo shell_exec('cd /root/eof-scraper/frontend && npm run build 2>&1');
echo shell_exec('pm2 restart drugalert-frontend || pm2 start npm --name "drugalert-frontend" --cwd /root/eof-scraper/frontend -- start 2>&1');

// Restart services
echo "\n\nRestarting services...\n";
echo shell_exec('systemctl restart nginx 2>&1');

echo "\n\nDeployment complete!";
echo "</pre>";
?>
