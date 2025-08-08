# VPS Deployment Checklist for DrugAlert.gr

## 🚀 Quick Deployment Steps

### 1. Purchase Hostinger VPS
- Go to Hostinger and purchase **KVM 1** plan (€7.99/month)
- Choose **Ubuntu 22.04** as the operating system
- Note down your server IP address

### 2. Update DNS Records
Add these DNS records in your domain provider:
- `A` record: `drugalert.gr` → Your VPS IP
- `A` record: `www.drugalert.gr` → Your VPS IP  
- `A` record: `api.drugalert.gr` → Your VPS IP

### 3. Connect to Your VPS
```bash
ssh root@YOUR_VPS_IP
```

### 4. Download and Run Deployment Script
```bash
# Download the deployment script
wget https://raw.githubusercontent.com/ghatzlv8/drugalert-gr/main/deploy-vps.sh

# Make it executable
chmod +x deploy-vps.sh

# Run the deployment script
./deploy-vps.sh
```

The script will automatically:
- ✅ Install all required software
- ✅ Set up PostgreSQL database
- ✅ Clone your repository
- ✅ Install dependencies
- ✅ Build the frontend
- ✅ Configure Nginx
- ✅ Set up services
- ✅ Configure firewall
- ✅ Set up automated backups
- ✅ Create cron jobs for scraping

### 5. Wait for DNS Propagation
Wait 5-30 minutes for DNS to propagate, then:

### 6. Set Up SSL Certificates
```bash
certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr
```

### 7. Configure Stripe (Important!)
1. Edit the configuration file:
   ```bash
   nano /var/www/drugalert/.env
   ```

2. Update these values with your Stripe keys:
   - `STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY`
   - `STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET`

3. Restart the API:
   ```bash
   systemctl restart drugalert-api
   ```

### 8. Set Up Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.drugalert.gr/auth/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook secret to your `.env` file

## 📋 Post-Deployment Checklist

- [ ] Test the website at https://drugalert.gr
- [ ] Test user registration
- [ ] Test login functionality
- [ ] Test push notifications
- [ ] Test subscription purchase
- [ ] Verify scraper is running (check logs)
- [ ] Set up monitoring (optional)

## 🔧 Useful Commands

### Check Service Status
```bash
# Backend API
systemctl status drugalert-api

# Frontend
pm2 status

# View logs
journalctl -u drugalert-api -f
pm2 logs drugalert-frontend
```

### Manual Database Backup
```bash
/usr/local/bin/backup-drugalert.sh
```

### Restart Services
```bash
systemctl restart drugalert-api
pm2 restart drugalert-frontend
```

## 🆘 Troubleshooting

### If the site doesn't load:
1. Check if services are running
2. Check Nginx error logs: `tail -f /var/log/nginx/error.log`
3. Ensure DNS has propagated: `nslookup drugalert.gr`

### If API returns errors:
1. Check API logs: `journalctl -u drugalert-api -n 100`
2. Verify database connection
3. Check `.env` file configuration

## 📞 Support Locations

- **Configuration file**: `/root/drugalert-config.txt`
- **Application directory**: `/var/www/drugalert`
- **Logs directory**: `/var/www/drugalert/logs`
- **Database backups**: `/var/backups/drugalert`

## 🎉 Done!

Your DrugAlert.gr platform should now be live and fully functional!
