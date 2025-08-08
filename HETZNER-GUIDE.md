# 🚀 Hetzner Cloud Deployment Guide

## Γρήγορη Εγκατάσταση σε 10 λεπτά

### 1️⃣ Δημιουργία Hetzner Account (2 λεπτά)
1. Πηγαίνετε στο https://www.hetzner.com/cloud
2. Κάντε **Sign Up**
3. Επιβεβαιώστε το email σας

### 2️⃣ Δημιουργία Server (3 λεπτά)
1. Click **"+ New Project"** → Ονομάστε το "DrugAlert"
2. Click **"+ Create Server"**
3. Επιλογές:
   - **Location**: Falkenstein (Germany) 
   - **Image**: Ubuntu 22.04
   - **Type**: CX11 (€3.79/month)
   - **SSH Key**: Skip για τώρα (θα χρησιμοποιήσουμε password)
   - **Name**: drugalert-server

4. Click **"Create & Buy now"**
5. **ΣΗΜΕΙΩΣΤΕ** το IP και το root password!

### 3️⃣ DNS Setup (2 λεπτά)
Στον domain provider σας, προσθέστε:
```
A Record: drugalert.gr → YOUR_SERVER_IP
A Record: www.drugalert.gr → YOUR_SERVER_IP
A Record: api.drugalert.gr → YOUR_SERVER_IP
```

### 4️⃣ Σύνδεση & Deployment (5 λεπτά)
Ανοίξτε terminal και τρέξτε:

```bash
# Συνδεθείτε στον server
ssh root@YOUR_SERVER_IP

# Κατεβάστε και τρέξτε το script
wget https://raw.githubusercontent.com/ghatzlv8/drugalert-gr/main/deploy-hetzner.sh
chmod +x deploy-hetzner.sh
./deploy-hetzner.sh
```

### 5️⃣ SSL Certificate (1 λεπτό)
Μετά από 10-15 λεπτά (DNS propagation):
```bash
certbot --nginx -d drugalert.gr -d www.drugalert.gr -d api.drugalert.gr
```

### 6️⃣ Stripe Setup
```bash
nano /var/www/drugalert/.env
# Αλλάξτε τα Stripe keys
systemctl restart drugalert-api
```

## ✅ Τέλος!

Το site σας τρέχει στο https://drugalert.gr

## 📊 Monitoring
```bash
# Check services
systemctl status drugalert-api
pm2 status

# View logs
journalctl -u drugalert-api -f
pm2 logs

# Server resources
htop
```

## 💰 Κόστος
- Hetzner CX11: **€3.79/μήνα**
- Σύνολο ετήσιο: **€45.48**

Πολύ πιο οικονομικό από Hostinger!
