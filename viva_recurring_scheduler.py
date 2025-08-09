#!/usr/bin/env python3
"""
Viva Recurring Payment Scheduler
Processes annual subscription renewals
"""
import schedule
import time
from datetime import datetime, timedelta
from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus, Payment
from config.config import DATABASE_URL
from viva_payments import viva_payments
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_manager = DatabaseManager(DATABASE_URL)

def check_subscription_renewals():
    """Check for subscriptions that need renewal"""
    session = db_manager.get_session()
    try:
        # Find subscriptions expiring in next 7 days
        expiry_window = datetime.utcnow() + timedelta(days=7)
        
        users_to_renew = session.query(User).filter(
            User.subscription_status == SubscriptionStatus.ACTIVE,
            User.subscription_end_date <= expiry_window,
            User.subscription_end_date > datetime.utcnow(),
            User.viva_transaction_id.isnot(None)  # Has previous transaction
        ).all()
        
        logger.info(f"Found {len(users_to_renew)} subscriptions to renew")
        
        for user in users_to_renew:
            try:
                # Check if we already tried to renew recently
                recent_payment = session.query(Payment).filter(
                    Payment.user_id == user.id,
                    Payment.payment_type == "subscription_renewal",
                    Payment.created_at > datetime.utcnow() - timedelta(days=3)
                ).first()
                
                if recent_payment:
                    logger.info(f"Skipping user {user.id} - recent renewal attempt exists")
                    continue
                
                # Attempt recurring payment
                logger.info(f"Processing renewal for user {user.id} ({user.email})")
                
                result = viva_payments.create_recurring_payment(
                    original_transaction_id=user.viva_transaction_id,
                    user_id=user.id
                )
                
                if result:
                    # Create payment record
                    payment = Payment(
                        user_id=user.id,
                        amount=viva_payments.annual_price_cents / 100,
                        currency="EUR",
                        payment_type="subscription_renewal",
                        payment_provider="viva",
                        viva_transaction_id=result.get("transactionId"),
                        status="succeeded"
                    )
                    session.add(payment)
                    
                    # Extend subscription
                    user.subscription_end_date = user.subscription_end_date + timedelta(days=365)
                    user.viva_transaction_id = result.get("transactionId")  # Update for next renewal
                    
                    logger.info(f"Successfully renewed subscription for user {user.id}")
                else:
                    # Log failed attempt
                    payment = Payment(
                        user_id=user.id,
                        amount=viva_payments.annual_price_cents / 100,
                        currency="EUR",
                        payment_type="subscription_renewal",
                        payment_provider="viva",
                        status="failed"
                    )
                    session.add(payment)
                    
                    logger.warning(f"Failed to renew subscription for user {user.id}")
                
                session.commit()
                
            except Exception as e:
                logger.error(f"Error processing renewal for user {user.id}: {e}")
                session.rollback()
                
    except Exception as e:
        logger.error(f"Error in renewal check: {e}")
    finally:
        session.close()

def expire_overdue_subscriptions():
    """Mark overdue subscriptions as expired"""
    session = db_manager.get_session()
    try:
        expired_users = session.query(User).filter(
            User.subscription_status == SubscriptionStatus.ACTIVE,
            User.subscription_end_date < datetime.utcnow()
        ).all()
        
        for user in expired_users:
            user.subscription_status = SubscriptionStatus.EXPIRED
            logger.info(f"Expired subscription for user {user.id} ({user.email})")
        
        session.commit()
        logger.info(f"Expired {len(expired_users)} subscriptions")
        
    except Exception as e:
        logger.error(f"Error expiring subscriptions: {e}")
        session.rollback()
    finally:
        session.close()

def main():
    """Run the scheduler"""
    logger.info("Starting Viva recurring payment scheduler")
    
    # Schedule tasks
    schedule.every().day.at("09:00").do(check_subscription_renewals)
    schedule.every().day.at("10:00").do(expire_overdue_subscriptions)
    
    # Run once on startup
    check_subscription_renewals()
    expire_overdue_subscriptions()
    
    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

if __name__ == "__main__":
    main()
