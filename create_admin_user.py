#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.user_models import User, SubscriptionStatus
import bcrypt

# Database connection
DATABASE_URL = "sqlite:///database/eof_scraper.db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def create_admin_user():
    email = "ghatz@lv8.gr"
    password = "DrugAlert2024!"
    
    # Check if user already exists
    existing_user = session.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User {email} already exists. Updating to admin...")
        existing_user.subscription_status = SubscriptionStatus.ACTIVE
        existing_user.subscription_start_date = datetime.utcnow()
        existing_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
        existing_user.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        session.commit()
        print(f"Updated user to admin with password: {password}")
        return
    
    # Create new admin user
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    admin_user = User(
        email=email,
        password_hash=password_hash,
        full_name="Admin User",
        phone="",
        subscription_status=SubscriptionStatus.ACTIVE,
        trial_start_date=datetime.utcnow(),
        trial_end_date=datetime.utcnow() + timedelta(days=365),
        subscription_start_date=datetime.utcnow(),
        subscription_end_date=datetime.utcnow() + timedelta(days=365),
        email_notifications=True,
        push_notifications=True,
        sms_notifications=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    session.add(admin_user)
    session.commit()
    
    print(f"Admin user created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Status: Active Premium Subscription")

if __name__ == "__main__":
    create_admin_user()
    session.close()
