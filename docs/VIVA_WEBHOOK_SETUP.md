# Viva Webhook Setup Instructions

## Overview
This guide explains how to configure webhooks in your Viva dashboard to receive payment notifications.

## Step 1: Access Webhook Settings

1. Log in to your Viva account at https://app.vivawallet.com
2. Navigate to **Settings** → **API Access** → **Webhooks**

## Step 2: Create a New Webhook

Click **"Create Webhook"** and configure:

### Webhook URL
```
https://drugalert.gr/api/auth/viva/webhook
```

### Events to Subscribe
Select the following event types:
- ✅ **Transaction Payment Created** (Event ID: 1796)
- ✅ **Transaction Failed** (Event ID: 1798)
- ✅ **Transaction Reversed** (Event ID: 1799)

### Verification Key
1. Viva will generate a unique **Verification Key** for your webhook
2. Copy this key - you'll need it for the next step
3. This key will be sent in the `Authorization` header as `Bearer [key]`

## Step 3: Update Your Configuration

Add the verification key to your `.env` file on the server:

```bash
ssh root@drugalert.gr
nano /opt/drugalert.gr/.env

# Update this line with your actual verification key:
VIVA_WEBHOOK_KEY=your_actual_verification_key_here
```

## Step 4: Test the Webhook

### From Viva Dashboard
1. In the webhook settings, click **"Test"**
2. Select an event type to test
3. Click **"Send Test"**
4. Check if you receive a 200 response with `{"status": "ok"}`

### Manual Test
```bash
curl -X POST https://drugalert.gr/api/auth/viva/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_verification_key_here" \
  -d '{
    "eventTypeId": 1796,
    "eventData": {
      "transactionId": "test-transaction-123",
      "orderCode": "test-order-123",
      "amount": 1499,
      "merchantTrns": "USER_1_ANNUAL_20240809",
      "statusId": "F",
      "fullName": "Test User",
      "email": "test@example.com",
      "cardNumber": "411111******1111",
      "currencyCode": "978",
      "customerTrns": "Annual subscription for test@example.com"
    }
  }'
```

## Step 5: Monitor Webhook Activity

### Check Logs
```bash
# API logs
ssh root@drugalert.gr "tail -f /opt/drugalert.gr/api.log | grep -i webhook"

# Check payment records
ssh root@drugalert.gr "cd /opt/drugalert.gr && ./venv/bin/python -c \"
from database.models import DatabaseManager
from database.user_models import Payment
from config.config import DATABASE_URL

db = DatabaseManager(DATABASE_URL)
session = db.get_session()
payments = session.query(Payment).filter(Payment.payment_provider=='viva').order_by(Payment.created_at.desc()).limit(5).all()
for p in payments:
    print(f'ID: {p.id}, User: {p.user_id}, Amount: €{p.amount}, Status: {p.status}, Date: {p.created_at}')
\""
```

## Webhook Response Format

Your webhook always returns HTTP 200 with JSON:

### Success Response
```json
{
  "status": "ok"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Invalid authorization"
}
```

## Important Notes

1. **Always return 200**: Viva expects HTTP 200 even for errors
2. **Verification**: The webhook verifies the `Authorization: Bearer [key]` header
3. **Idempotency**: Handle duplicate webhooks gracefully
4. **Timeout**: Process webhooks quickly (< 10 seconds)

## Troubleshooting

### Webhook Not Receiving Events
1. Check if webhook is enabled in Viva dashboard
2. Verify the URL is correct and HTTPS
3. Check server logs for incoming requests

### Authorization Failures
1. Ensure the verification key in `.env` matches Viva dashboard
2. Check the Authorization header format: `Bearer [key]`
3. No extra spaces or quotes in the key

### Processing Errors
1. Check if user exists in database (extracted from merchantTrns)
2. Verify database columns exist (run migration if needed)
3. Check API logs for detailed error messages

## Event Types Reference

| Event ID | Event Name | Description |
|----------|------------|-------------|
| 1796 | Transaction Payment Created | Payment successful |
| 1798 | Transaction Failed | Payment failed |
| 1799 | Transaction Reversed | Refund/reversal |

## Support
- Viva Webhook Docs: https://developer.viva.com/webhooks-for-payments/
- Viva Support: support@vivawallet.com
