#!/usr/bin/env python3
"""Create test user with email geohatz1506@gmail.com"""

from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus
from datetime import datetime, timedelta
import bcrypt

# Database URL
DATABASE_URL = "sqlite:///database/eof_posts.db"

# Initialize database
db_manager = DatabaseManager(DATABASE_URL)

def create_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_test_user():
    session = db_manager.get_session()
    try:
        # Check if user already exists
        existing_user = session.query(User).filter(User.email == "geohatz1506@gmail.com").first()
        if existing_user:
            print(f"User geohatz1506@gmail.com already exists with status: {existing_user.subscription_status}")
            return
        
        # Create new test user
        test_user = User(
            email="geohatz1506@gmail.com",
            password_hash=create_password_hash("test123"),  # You can change this password
            full_name="Test User",
            subscription_status=SubscriptionStatus.TRIAL,
            trial_end_date=datetime.utcnow() + timedelta(days=4),
            created_at=datetime.utcnow()
        )
        
        session.add(test_user)
        session.commit()
        
        print(f"✅ Created test user: geohatz1506@gmail.com")
        print(f"   Password: test123")
        print(f"   Status: {test_user.subscription_status}")
        print(f"   Trial ends: {test_user.trial_end_date}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    create_test_user()
