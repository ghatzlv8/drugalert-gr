#!/usr/bin/env python3
"""
Setup admin user and add user management functionality
"""
import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Boolean, Float, Text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import bcrypt
from dotenv import load_dotenv

# Add the project directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://drugalert_user:drugalert_password@localhost/drugalert_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription_status = Column(String, default="trial")
    trial_end_date = Column(DateTime)
    subscription_end_date = Column(DateTime)
    stripe_customer_id = Column(String)
    stripe_subscription_id = Column(String)
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    sms_credits = Column(Float, default=0.0)
    phone = Column(String)
    # Add tracking fields
    referral_source = Column(String)  # Where user came from
    utm_source = Column(String)
    utm_medium = Column(String)
    utm_campaign = Column(String)
    user_agent = Column(Text)
    ip_address = Column(String)
    last_login = Column(DateTime)
    login_count = Column(Integer, default=0)

def create_password_hash(password: str) -> str:
    """Create a bcrypt password hash"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def setup_admin():
    """Create or update admin user"""
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.email == "admin@drugalert.gr").first()
        
        if admin:
            # Update existing admin
            admin.is_admin = True
            admin.hashed_password = create_password_hash("admin@DrugAlert2024!")
            admin.subscription_status = "active"
            admin.subscription_end_date = datetime.utcnow() + timedelta(days=3650)  # 10 years
            print("Admin user updated successfully!")
        else:
            # Create new admin
            admin = User(
                email="admin@drugalert.gr",
                hashed_password=create_password_hash("admin@DrugAlert2024!"),
                full_name="Administrator",
                is_active=True,
                is_admin=True,
                subscription_status="active",
                trial_end_date=datetime.utcnow() + timedelta(days=10),
                subscription_end_date=datetime.utcnow() + timedelta(days=3650),  # 10 years
                referral_source="system"
            )
            db.add(admin)
            print("Admin user created successfully!")
        
        db.commit()
        print("\nAdmin credentials:")
        print("Email: admin@drugalert.gr")
        print("Password: admin@DrugAlert2024!")
        
    except Exception as e:
        print(f"Error setting up admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    setup_admin()
