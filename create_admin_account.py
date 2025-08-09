#!/usr/bin/env python3
"""Create admin user for admin panel"""

from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus
from datetime import datetime, timedelta
import bcrypt
import sys

# Database URL - using the correct database
DATABASE_URL = "sqlite:///database/eof_scraper.db"

# Initialize database
db_manager = DatabaseManager(DATABASE_URL)

def create_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_admin_account():
    """Create admin account with known credentials"""
    email = "admin@drugalert.gr"
    password = "Admin123!"
    
    session = db_manager.get_session()
    try:
        # Check if user already exists
        existing_user = session.query(User).filter(User.email == email).first()
        if existing_user:
            print(f"User {email} already exists. Updating password...")
            existing_user.password_hash = create_password_hash(password)
            existing_user.subscription_status = SubscriptionStatus.ACTIVE
            existing_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
            session.commit()
            print(f"✅ Updated admin user")
        else:
            # Create new admin user
            admin_user = User(
                email=email,
                password_hash=create_password_hash(password),
                full_name="Administrator",
                subscription_status=SubscriptionStatus.ACTIVE,
                trial_end_date=datetime.utcnow() + timedelta(days=365),
                subscription_start_date=datetime.utcnow(),
                subscription_end_date=datetime.utcnow() + timedelta(days=365),
                created_at=datetime.utcnow()
            )
            
            session.add(admin_user)
            session.commit()
            print(f"✅ Created new admin user")
        
        print(f"\n📧 Admin Email: {email}")
        print(f"🔑 Admin Password: {password}")
        print(f"\nYou can now login at https://drugalert.gr/admin")
        
        # List all users in database
        print("\n📋 All users in database:")
        all_users = session.query(User).all()
        for user in all_users:
            print(f"  - {user.email} ({user.subscription_status})")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        session.rollback()
        sys.exit(1)
    finally:
        session.close()

if __name__ == "__main__":
    create_admin_account()
