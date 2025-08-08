#!/usr/bin/env python3
"""
Check for expired trials and disable push notifications
This should be run periodically (e.g., daily via cron)
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.user_models import User, SubscriptionStatus, PushSubscription
from config.config import DATABASE_URL

def check_expired_trials():
    """Check for expired trials and disable push notifications"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        now = datetime.utcnow()
        
        # Find users with expired trials
        expired_trial_users = session.query(User).filter(
            User.subscription_status == SubscriptionStatus.TRIAL,
            User.trial_end_date < now
        ).all()
        
        print(f"Found {len(expired_trial_users)} users with expired trials")
        
        for user in expired_trial_users:
            # Update subscription status
            user.subscription_status = SubscriptionStatus.EXPIRED
            
            # Disable push notifications
            user.push_notifications = False
            
            # Remove push subscriptions
            session.query(PushSubscription).filter(
                PushSubscription.user_id == user.id
            ).delete()
            
            print(f"Updated user {user.email}: trial expired, push notifications disabled")
        
        # Find users with expired subscriptions
        expired_subscription_users = session.query(User).filter(
            User.subscription_status == SubscriptionStatus.ACTIVE,
            User.subscription_end_date != None,
            User.subscription_end_date < now
        ).all()
        
        print(f"Found {len(expired_subscription_users)} users with expired subscriptions")
        
        for user in expired_subscription_users:
            # Update subscription status
            user.subscription_status = SubscriptionStatus.EXPIRED
            
            # Disable push notifications
            user.push_notifications = False
            
            # Remove push subscriptions
            session.query(PushSubscription).filter(
                PushSubscription.user_id == user.id
            ).delete()
            
            print(f"Updated user {user.email}: subscription expired, push notifications disabled")
        
        # Commit all changes
        session.commit()
        print("All updates completed successfully")
        
    except Exception as e:
        print(f"Error checking expired trials: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    check_expired_trials()
