#!/usr/bin/env python3
"""
Script to delete all users from the database
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.user_models import User, SavedSearch, NotificationLog, PushSubscription, UserReadPost, Payment
from config.config import DATABASE_URL

def delete_all_users():
    """Delete all users and related data from the database"""
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # First delete all related records
        print("Deleting user read posts...")
        session.query(UserReadPost).delete()
        
        print("Deleting push subscriptions...")
        session.query(PushSubscription).delete()
        
        print("Deleting notification logs...")
        session.query(NotificationLog).delete()
        
        print("Deleting saved searches...")
        session.query(SavedSearch).delete()
        
        print("Deleting payments...")
        session.query(Payment).delete()
        
        # Now delete all users
        print("Deleting all users...")
        user_count = session.query(User).count()
        session.query(User).delete()
        
        session.commit()
        print(f"Successfully deleted {user_count} users and all related data.")
        
    except Exception as e:
        session.rollback()
        print(f"Error deleting users: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    confirm = input("Are you sure you want to delete ALL users? This cannot be undone! (yes/no): ")
    if confirm.lower() == 'yes':
        delete_all_users()
    else:
        print("Operation cancelled.")
