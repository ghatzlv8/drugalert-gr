# EOF Alert System - Complete Deployment Guide

## System Overview

The EOF Alert System consists of:
1. **Scraper**: Monitors EOF website every 15 minutes
2. **API**: Serves data with authentication and payment processing
3. **Frontend**: Next.js app with free trial and premium subscriptions
4. **Database**: PostgreSQL for production (SQLite for development)

## Pricing Model
- **Free Trial**: 10 days full access, no credit card required
- **Premium**: €14.99/year for unlimited access
- **SMS Credits**: €0.15 per SMS (pay as you go)

## Quick Start

### 1. Start Backend Services
```bash
cd ~/eof-scraper

# Update the docker-compose to use the combined API
# Edit docker-compose.yml and change the api command to:
# command: python api_combined.py

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### 2. Set Up Frontend
```bash
cd ~/eof-scraper/frontend

# Install dependencies
npm install

# Create .env.local file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
EOF

# Run development server
npm run dev
```

### 3. Access the System
- Frontend: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Database: PostgreSQL on localhost:5432

## Environment Variables

### Backend (.env)
```
# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://eof_user:eof_password@postgres:5432/eof_scraper

# JWT Auth
JWT_SECRET_KEY=your-very-secure-secret-key-change-this

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000

# Email Service (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Production Deployment

### 1. Database Setup
```sql
-- Create production database
CREATE DATABASE eof_alert_prod;
CREATE USER eof_prod_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE eof_alert_prod TO eof_prod_user;
```

### 2. Backend Deployment (Docker)
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: eof_alert_prod
      POSTGRES_USER: eof_prod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  scraper:
    build: .
    command: python scheduler.py
    environment:
      DATABASE_URL: ${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
    restart: always
    depends_on:
      - postgres

  api:
    build: .
    command: python api_combined.py
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    restart: always
    depends_on:
      - postgres

volumes:
  postgres_data:
```

### 3. Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Stripe Setup

### 1. Create Products
```bash
# Annual Subscription
stripe products create \
  --name="EOF Alert Premium" \
  --description="Annual subscription to EOF Alert service"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=1499 \
  --currency=eur \
  --recurring[interval]=year
```

### 2. Set Up Webhooks
- Endpoint URL: https://api.yourdomain.com/auth/stripe/webhook
- Events to listen:
  - checkout.session.completed
  - customer.subscription.updated
  - customer.subscription.deleted

## Monitoring

### 1. Health Checks
```python
# Add to api_combined.py
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "services": {
            "database": check_database_connection(),
            "scraper": check_last_scrape_time()
        }
    }
```

### 2. Metrics to Track
- Total users (free vs premium)
- Conversion rate (trial to premium)
- SMS usage and costs
- Scraper success rate
- API response times
- User engagement (logins, searches)

### 3. Alerts to Set Up
- Scraper failures
- Database connection issues
- High SMS usage (cost control)
- Subscription payment failures
- API errors > threshold

## Security Checklist

- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS on all endpoints
- [ ] Set up rate limiting on API
- [ ] Regular database backups
- [ ] Monitor for suspicious activity
- [ ] Implement request validation
- [ ] Set up CORS properly
- [ ] Use secure session management
- [ ] Implement proper error handling

## Maintenance

### Daily
- Check scraper logs for errors
- Monitor API performance
- Review new user signups

### Weekly
- Database backup verification
- Review SMS usage and costs
- Check Stripe payment issues

### Monthly
- Update dependencies
- Review and optimize queries
- Analyze user engagement metrics
- Clean up old logs

## Support

For production issues:
1. Check logs: `docker-compose logs -f [service]`
2. Verify database connection
3. Check Stripe webhook logs
4. Monitor API endpoints

## Revenue Projections

Based on similar services:
- Conversion rate: 2-5% (trial to premium)
- Monthly new trials: 500-1000
- Expected premium users: 10-50/month
- Monthly revenue: €150-750
- SMS revenue: Variable based on usage

## Next Steps

1. Implement email notifications service
2. Add push notification support
3. Create mobile apps (React Native)
4. Add more EOF data sources
5. Implement data export features
6. Add team/organization accounts
7. Create affiliate program
