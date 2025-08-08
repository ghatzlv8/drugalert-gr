from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, ForeignKey, Enum, Table
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
from .models import Base

class SubscriptionStatus(enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class NotificationType(enum.Enum):
    EMAIL = "email"
    PUSH = "push"
    SMS = "sms"

# Association table for user notifications preferences
user_notification_preferences = Table(
    'user_notification_preferences',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('category_id', Integer, ForeignKey('categories.id')),
    Column('notification_type', Enum(NotificationType)),
    Column('enabled', Boolean, default=True)
)

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))  # For SMS notifications
    
    # Subscription info
    subscription_status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.TRIAL)
    trial_start_date = Column(DateTime, default=datetime.utcnow)
    trial_end_date = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=10))
    subscription_start_date = Column(DateTime)
    subscription_end_date = Column(DateTime)
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    
    # Notification settings
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    sms_credits = Column(Float, default=0.0)  # SMS credits in EUR
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    notification_logs = relationship("NotificationLog", back_populates="user", cascade="all, delete-orphan")
    saved_searches = relationship("SavedSearch", back_populates="user", cascade="all, delete-orphan")
    read_posts = relationship("UserReadPost", back_populates="user", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='EUR')
    payment_type = Column(String(50))  # subscription, sms_credits
    stripe_payment_intent_id = Column(String(255))
    status = Column(String(50))  # pending, succeeded, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="payments")

class NotificationLog(Base):
    __tablename__ = 'notification_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    post_id = Column(Integer, ForeignKey('posts.id'))
    notification_type = Column(Enum(NotificationType))
    status = Column(String(50))  # sent, failed, pending
    message = Column(Text)
    cost = Column(Float, default=0.0)  # For SMS costs
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="notification_logs")

class SavedSearch(Base):
    __tablename__ = 'saved_searches'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    name = Column(String(255))
    query = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'))
    keywords = Column(Text)
    notify_email = Column(Boolean, default=True)
    notify_push = Column(Boolean, default=True)
    notify_sms = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="saved_searches")

class UserReadPost(Base):
    __tablename__ = 'user_read_posts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    post_id = Column(Integer, ForeignKey('posts.id'))
    read_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="read_posts")

class PushSubscription(Base):
    __tablename__ = 'push_subscriptions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    endpoint = Column(Text, nullable=False)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (
        {'sqlite_autoincrement': True}
    )
