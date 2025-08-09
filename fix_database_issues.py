#!/usr/bin/env python3
"""Fix database issues - consolidate users and fix trial days"""

from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus
from datetime import datetime, timedelta
import bcrypt

# Database URL
DATABASE_URL = "sqlite:///database/eof_scraper.db"

# Initialize database
db_manager = DatabaseManager(DATABASE_URL)

def fix_database():
    session = db_manager.get_session()
    try:
        print("🔧 Fixing database issues...")
        
        # 1. List all current users
        all_users = session.query(User).all()
        print(f"\n📋 Current users in database: {len(all_users)}")
        for user in all_users:
            print(f"  - {user.email} ({user.subscription_status})")
        
        # 2. Keep only the users we want
        keep_emails = ['ghatz@lv8.gr', 'geohatz1506@gmail.com']
        
        # Delete unwanted users
        deleted_count = 0
        for user in all_users:
            if user.email not in keep_emails and user.email != 'admin@drugalert.gr':
                session.delete(user)
                deleted_count += 1
                print(f"  ❌ Deleted: {user.email}")
        
        if deleted_count > 0:
            session.commit()
            print(f"\n✅ Deleted {deleted_count} unwanted users")
        
        # 3. Fix ghatz@lv8.gr (admin user)
        admin_user = session.query(User).filter(User.email == 'ghatz@lv8.gr').first()
        if admin_user:
            admin_user.subscription_status = SubscriptionStatus.ACTIVE
            admin_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
            admin_user.full_name = "Administrator"
            print(f"\n✅ Fixed admin user: ghatz@lv8.gr")
        else:
            print(f"\n⚠️  Admin user ghatz@lv8.gr not found!")
        
        # 4. Fix geohatz1506@gmail.com (test user with 4-day trial)
        test_user = session.query(User).filter(User.email == 'geohatz1506@gmail.com').first()
        if test_user:
            # Reset to 4-day trial from now
            test_user.subscription_status = SubscriptionStatus.TRIAL
            test_user.trial_start_date = datetime.utcnow()
            test_user.trial_end_date = datetime.utcnow() + timedelta(days=4)
            test_user.created_at = test_user.created_at or datetime.utcnow()
            print(f"\n✅ Fixed test user: geohatz1506@gmail.com")
            print(f"   Trial ends: {test_user.trial_end_date}")
            
            # Calculate days remaining
            time_remaining = test_user.trial_end_date - datetime.utcnow()
            days_remaining = int(time_remaining.total_seconds() / 86400) + 1
            print(f"   Trial days remaining: {days_remaining}")
        else:
            print(f"\n⚠️  Test user geohatz1506@gmail.com not found!")
        
        # 5. Delete the admin@drugalert.gr user if exists (we'll use ghatz@lv8.gr as admin)
        admin_drugalert = session.query(User).filter(User.email == 'admin@drugalert.gr').first()
        if admin_drugalert:
            session.delete(admin_drugalert)
            print(f"\n❌ Deleted duplicate admin: admin@drugalert.gr")
        
        session.commit()
        
        # 6. Final user list
        print("\n📋 Final users in database:")
        final_users = session.query(User).all()
        for user in final_users:
            print(f"\n  Email: {user.email}")
            print(f"  Status: {user.subscription_status}")
            if user.subscription_status == SubscriptionStatus.TRIAL:
                time_remaining = user.trial_end_date - datetime.utcnow()
                days_remaining = int(time_remaining.total_seconds() / 86400) + 1
                print(f"  Trial ends: {user.trial_end_date}")
                print(f"  Trial days remaining: {days_remaining}")
            elif user.subscription_status == SubscriptionStatus.ACTIVE:
                print(f"  Subscription ends: {user.subscription_end_date}")
        
        print("\n✅ Database fixed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    fix_database()
