"""
Viva Payments Integration for DrugAlert.gr
Handles recurring annual subscriptions
"""
import os
from dotenv import load_dotenv
import requests
import json
import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

class VivaPayments:
    def __init__(self):
        self.client_id = os.getenv("VIVA_CLIENT_ID")
        self.client_secret = os.getenv("VIVA_CLIENT_SECRET")
        self.merchant_id = os.getenv("VIVA_MERCHANT_ID")
        self.api_key = os.getenv("VIVA_API_KEY")
        self.webhook_key = os.getenv("VIVA_WEBHOOK_KEY")
        
        # Use demo environment for testing, production for live
        self.is_production = os.getenv("VIVA_PRODUCTION", "false").lower() == "true"
        self.base_url = "https://api.vivapayments.com" if self.is_production else "https://demo-api.vivapayments.com"
        self.accounts_url = "https://accounts.vivapayments.com" if self.is_production else "https://demo-accounts.vivapayments.com"
        
        # Subscription settings
        self.annual_price_cents = int(os.getenv("ANNUAL_SUBSCRIPTION_PRICE", "4900"))  # 49.00 EUR default
        self.currency = "EUR"
        
    def get_access_token(self) -> Optional[str]:
        """Get OAuth2 access token for API calls"""
        try:
            response = requests.post(
                f"{self.accounts_url}/connect/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            response.raise_for_status()
            return response.json()["access_token"]
        except Exception as e:
            logger.error(f"Failed to get Viva access token: {e}")
            return None
    
    def create_payment_order(self, user_email: str, user_id: int, is_recurring: bool = True) -> Optional[Dict[str, Any]]:
        """Create a payment order for subscription"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        try:
            # Calculate subscription period
            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=365)
            
            order_data = {
                "amount": self.annual_price_cents,
                "customerTrns": f"Annual subscription for {user_email}",
                "customer": {
                    "email": user_email,
                    "fullName": user_email,
                    "requestLang": "el-GR"
                },
                "paymentTimeout": 1800,  # 30 minutes
                "preauth": False,
                "allowRecurring": is_recurring,
                "maxInstallments": 0,
                "paymentNotification": True,
                "tipAmount": 0,
                "disableExactAmount": False,
                "disableCash": True,
                "disableWallet": False,
                "sourceCode": os.getenv("VIVA_SOURCE_CODE", "Default"),
                "merchantTrns": f"USER_{user_id}_ANNUAL_{start_date.strftime('%Y%m%d')}",
                "tags": [
                    "DrugAlert",
                    "Annual",
                    f"User_{user_id}"
                ]
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.base_url}/checkout/v2/orders",
                json=order_data,
                headers=headers
            )
            response.raise_for_status()
            
            order = response.json()
            logger.info(f"Created Viva order {order['orderCode']} for user {user_id}")
            
            # For Native Checkout, return the order code to be used with Native SDK
            return {
                "order_code": order["orderCode"],
                "amount": self.annual_price_cents,
                "checkout_url": f"{self.base_url}/web/checkout?ref={order['orderCode']}",  # Fallback URL
                "order_data": order
            }
            
        except Exception as e:
            logger.error(f"Failed to create Viva payment order: {e}")
            return None
    
    def create_recurring_payment(self, original_transaction_id: str, user_id: int) -> Optional[Dict[str, Any]]:
        """Create a recurring payment using stored card token"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        try:
            recurring_data = {
                "amount": self.annual_price_cents,
                "installments": 0,
                "customerTrns": f"Recurring annual subscription - User {user_id}",
                "merchantTrns": f"RECURRING_USER_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}",
                "sourceCode": os.getenv("VIVA_SOURCE_CODE", "Default")
            }
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.base_url}/api/transactions/{original_transaction_id}/recurring",
                json=recurring_data,
                headers=headers
            )
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"Created recurring payment for user {user_id}: {result['transactionId']}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to create recurring payment: {e}")
            return None
    
    def cancel_recurring(self, recurring_token: str) -> bool:
        """Cancel a recurring payment authorization"""
        access_token = self.get_access_token()
        if not access_token:
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            response = requests.delete(
                f"{self.base_url}/api/cards/{recurring_token}",
                headers=headers
            )
            response.raise_for_status()
            
            logger.info(f"Cancelled recurring token {recurring_token}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cancel recurring payment: {e}")
            return False
    
    def verify_webhook(self, request_body: bytes, authorization_header: str) -> bool:
        """Verify webhook signature according to Viva guidelines"""
        try:
            # Extract the verification key from Authorization header
            # Format: "Bearer [verification_key]"
            if not authorization_header or not authorization_header.startswith("Bearer "):
                logger.error("Invalid or missing Authorization header")
                return False
            
            provided_key = authorization_header[7:]  # Remove "Bearer " prefix
            
            # Get the webhook verification key from settings
            webhook_key = self.webhook_key or os.getenv("VIVA_WEBHOOK_VERIFICATION_KEY")
            
            if not webhook_key:
                logger.warning("No webhook verification key configured")
                return False
            
            # Compare the keys
            return hmac.compare_digest(provided_key, webhook_key)
            
        except Exception as e:
            logger.error(f"Failed to verify webhook: {e}")
            return False
    
    def process_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process incoming webhook from Viva"""
        try:
            event_type = webhook_data.get("eventTypeId")
            event_data = webhook_data.get("eventData", {})
            
            result = {
                "success": False,
                "action": None,
                "transaction_id": None,
                "order_code": None,
                "user_id": None,
                "amount": None
            }
            
            # Extract common fields
            result["transaction_id"] = event_data.get("transactionId")
            result["order_code"] = event_data.get("orderCode")
            result["amount"] = event_data.get("amount")
            
            # Try to extract user_id from merchantTrns
            merchant_trns = event_data.get("merchantTrns", "")
            if merchant_trns and "USER_" in merchant_trns:
                try:
                    # Format: USER_123_ANNUAL_20240809
                    parts = merchant_trns.split("_")
                    if len(parts) >= 2:
                        result["user_id"] = int(parts[1])
                except:
                    pass
            
            # Handle different event types
            if event_type == 1796:  # Transaction Payment Created
                result["success"] = True
                result["action"] = "payment_created"
                logger.info(f"Payment created: {result['transaction_id']}")
                
            elif event_type == 1798:  # Transaction Failed
                result["success"] = False
                result["action"] = "payment_failed"
                logger.warning(f"Payment failed: {result['transaction_id']}")
                
            elif event_type == 1799:  # Transaction Reversed/Refunded
                result["success"] = True
                result["action"] = "payment_reversed"
                logger.info(f"Payment reversed: {result['transaction_id']}")
                
            else:
                logger.info(f"Unhandled webhook event type: {event_type}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to process webhook: {e}")
            return {"success": False, "error": str(e)}
    
    def get_transaction_details(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get details of a specific transaction"""
        access_token = self.get_access_token()
        if not access_token:
            return None
        
        try:
            headers = {
                "Authorization": f"Bearer {access_token}"
            }
            
            response = requests.get(
                f"{self.base_url}/api/transactions/{transaction_id}",
                headers=headers
            )
            response.raise_for_status()
            
            return response.json()
            
        except Exception as e:
            logger.error(f"Failed to get transaction details: {e}")
            return None


# Singleton instance
viva_payments = VivaPayments()
