#!/usr/bin/env python3
from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus
from config.config import DATABASE_URL
from datetime import datetime, timedelta
import bcrypt

def create_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Create test user
db_manager = DatabaseManager(DATABASE_URL)
session = db_manager.get_session()

try:
    # Check if test user exists
    test_user = session.query(User).filter(User.email == "test@example.com").first()
    
    if test_user:
        print(f"Test user already exists: {test_user.email}")
        # Update password just in case
        test_user.password_hash = create_password_hash("test123")
        session.commit()
        print("Password updated to: test123")
    else:
        # Create new test user
        test_user = User(
            email="test@example.com",
            password_hash=create_password_hash("test123"),
            full_name="Test User",
            subscription_status=SubscriptionStatus.TRIAL,
            trial_end_date=datetime.utcnow() + timedelta(days=7),
            email_notifications=True,
            push_notifications=True,
            sms_notifications=False,
            sms_credits=0.0
        )
        session.add(test_user)
        session.commit()
        print(f"Created test user: {test_user.email}")
        print("Password: test123")
    
    print(f"User ID: {test_user.id}")
    print(f"Trial ends: {test_user.trial_end_date}")

except Exception as e:
    print(f"Error: {e}")
    session.rollback()
finally:
    session.close()
