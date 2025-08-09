# Viva Payments Integration Setup Guide

## Overview
This guide explains how to set up Viva Payments for recurring annual subscriptions on DrugAlert.gr.

## Prerequisites
- Viva Wallet merchant account
- API credentials from Viva
- SSL certificate (for webhooks)

## Step 1: Get Viva API Credentials

1. Log in to your Viva Wallet account
2. Go to **Settings** → **API Access**
3. Create a new API client with these permissions:
   - Create Payment Orders
   - View Transactions
   - Recurring Payments
   - Webhooks

4. Note down:
   - Client ID
   - Client Secret
   - Merchant ID
   - API Key

## Step 2: Configure Webhooks

1. In Viva dashboard, go to **Settings** → **Webhooks**
2. Add a new webhook:
   - URL: `https://drugalert.gr/api/auth/viva/webhook`
   - Events to subscribe:
     - Transaction Payment Created
     - Transaction Failed
     - Transaction Reversed

3. Note down the **Webhook Verification Key**

## Step 3: Set Up Success/Failure URLs

In your Viva account settings, configure:
- Success URL: `https://drugalert.gr/subscription/success`
- Failure URL: `https://drugalert.gr/subscription/failed`

## Step 4: Configure Environment Variables

1. Copy `.env.viva.template` to `.env`:
```bash
cp .env.viva.template .env
```

2. Fill in your credentials:
```env
VIVA_CLIENT_ID=your_actual_client_id
VIVA_CLIENT_SECRET=your_actual_client_secret
VIVA_MERCHANT_ID=your_merchant_id
VIVA_API_KEY=your_api_key
VIVA_WEBHOOK_KEY=your_webhook_key
VIVA_PRODUCTION=true  # Set to true for production
VIVA_SOURCE_CODE=Default  # Or your custom source code
ANNUAL_SUBSCRIPTION_PRICE=4900  # 49.00 EUR in cents
```

## Step 5: Run Database Migration

```bash
cd /opt/drugalert.gr
python migrations/add_viva_payments.py
```

## Step 6: Deploy the Updated API

1. Copy files to server:
```bash
scp api_auth.py root@drugalert.gr:/opt/drugalert.gr/
scp viva_payments.py root@drugalert.gr:/opt/drugalert.gr/
scp database/user_models.py root@drugalert.gr:/opt/drugalert.gr/database/
```

2. Copy environment file:
```bash
scp .env root@drugalert.gr:/opt/drugalert.gr/
```

3. Restart the API:
```bash
ssh root@drugalert.gr "cd /opt/drugalert.gr && pkill -f python && nohup ./venv/bin/python api_combined.py > api.log 2>&1 &"
```

## Step 7: Set Up Recurring Payment Scheduler

1. Copy the scheduler:
```bash
scp viva_recurring_scheduler.py root@drugalert.gr:/opt/drugalert.gr/
```

2. Set up as a systemd service:
```bash
ssh root@drugalert.gr
cat > /etc/systemd/system/viva-scheduler.service << EOF
[Unit]
Description=Viva Recurring Payment Scheduler
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/drugalert.gr
Environment="PATH=/opt/drugalert.gr/venv/bin"
ExecStart=/opt/drugalert.gr/venv/bin/python viva_recurring_scheduler.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable viva-scheduler
systemctl start viva-scheduler
```

## Step 8: Update Frontend for Native Checkout

Since you're using Native Checkout, the payment form is embedded in your site:

1. **Install Viva Native SDK** in your HTML:
```html
<script src="https://www.vivapayments.com/web/checkout/v2/js"></script>
```

2. **Create payment form component** (see `frontend/VivaCheckout.jsx`)

3. **Handle payment flow**:
   - Call `/auth/subscription/checkout` to get order code
   - Initialize Native Checkout with order code
   - Handle success/error callbacks
   - No redirect needed - payment happens on your site!

4. **Update success/failure handling** to show inline messages

### Benefits of Native Checkout:
- No Viva branding/logo on payment form
- Seamless integration with your site design
- Better user experience (no redirects)
- Full control over the UI

## Testing

### Test in Demo Mode
1. Set `VIVA_PRODUCTION=false` in `.env`
2. Use Viva demo credentials
3. Test cards:
   - Success: 4111 1111 1111 1111
   - Failure: 4000 0000 0000 0002

### Test Webhook
```bash
curl -X POST https://drugalert.gr/api/auth/viva/webhook \
  -H "Content-Type: application/json" \
  -H "X-Viva-Signature: test_signature" \
  -d '{
    "eventTypeId": 1796,
    "eventData": {
      "transactionId": "test123",
      "orderCode": "order123",
      "amount": 4900,
      "merchantTrns": "USER_1_ANNUAL_20240809"
    }
  }'
```

## Monitoring

Check logs:
```bash
# API logs
tail -f /opt/drugalert.gr/api.log

# Scheduler logs
journalctl -u viva-scheduler -f

# Payment records
sqlite3 /opt/drugalert.gr/drugalert.db "SELECT * FROM payments WHERE payment_provider='viva' ORDER BY created_at DESC LIMIT 10;"
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized from Viva API**
   - Check CLIENT_ID and CLIENT_SECRET
   - Ensure credentials match production/demo environment

2. **Webhook signature verification fails**
   - Verify VIVA_WEBHOOK_KEY is correct
   - Check webhook configuration in Viva dashboard

3. **Recurring payments fail**
   - Ensure original transaction had `allowRecurring: true`
   - Check if card supports recurring payments
   - Verify transaction ID is valid

### Support
- Viva API Docs: https://developer.vivawallet.com/
- Viva Support: support@vivawallet.com
