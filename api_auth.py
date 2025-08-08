from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import bcrypt
import jwt
import stripe
import os
from sqlalchemy.orm import Session

from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus, Payment, SavedSearch, NotificationLog, NotificationType, PushSubscription, UserReadPost
from config.config import DATABASE_URL

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_...")

# Initialize
security = HTTPBearer()
db_manager = DatabaseManager(DATABASE_URL)

# Pydantic models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    subscription_status: str
    trial_end_date: datetime
    subscription_end_date: Optional[datetime]
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    sms_credits: float
    
    class Config:
        from_attributes = True

class SubscriptionCheckout(BaseModel):
    price_id: str = "price_1234567890"  # Stripe price ID for annual subscription

class SMSCreditsCheckout(BaseModel):
    amount: float  # Amount in EUR

class SavedSearchCreate(BaseModel):
    name: str
    category_id: Optional[int]
    keywords: Optional[str]
    notify_email: bool = True
    notify_push: bool = True
    notify_sms: bool = False

class NotificationPreferences(BaseModel):
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool

# Helper functions
def create_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    session = db_manager.get_session()
    try:
        user = session.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if subscription is expired
        if user.subscription_status == SubscriptionStatus.TRIAL:
            if datetime.utcnow() > user.trial_end_date:
                user.subscription_status = SubscriptionStatus.EXPIRED
                session.commit()
        elif user.subscription_status == SubscriptionStatus.ACTIVE:
            if user.subscription_end_date and datetime.utcnow() > user.subscription_end_date:
                user.subscription_status = SubscriptionStatus.EXPIRED
                session.commit()
        
        return user
    finally:
        session.close()

# API Extension
def create_auth_app(app: FastAPI):
    
    @app.post("/auth/signup", response_model=dict)
    async def signup(user_data: UserSignup):
        session = db_manager.get_session()
        try:
            # Check if user exists
            existing_user = session.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Create new user
            new_user = User(
                email=user_data.email,
                password_hash=create_password_hash(user_data.password),
                full_name=user_data.full_name,
                phone=user_data.phone
            )
            session.add(new_user)
            session.commit()
            
            # Create Stripe customer
            try:
                stripe_customer = stripe.Customer.create(
                    email=user_data.email,
                    name=user_data.full_name,
                    metadata={"user_id": str(new_user.id)}
                )
                new_user.stripe_customer_id = stripe_customer.id
                session.commit()
            except Exception as e:
                print(f"Stripe customer creation failed: {e}")
            
            # Create access token
            access_token = create_access_token({"sub": str(new_user.id)})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse.from_orm(new_user).dict()
            }
        finally:
            session.close()
    
    @app.post("/auth/login", response_model=dict)
    async def login(credentials: UserLogin):
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(User.email == credentials.email).first()
            
            if not user or not verify_password(credentials.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Update last login
            user.last_login = datetime.utcnow()
            session.commit()
            
            # Create access token
            access_token = create_access_token({"sub": str(user.id)})
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": UserResponse.from_orm(user).dict()
            }
        finally:
            session.close()
    
    @app.get("/auth/me", response_model=UserResponse)
    async def get_me(current_user: User = Depends(get_current_user)):
        return UserResponse.from_orm(current_user)
    
    @app.post("/auth/subscription/checkout")
    async def create_subscription_checkout(
        checkout_data: SubscriptionCheckout,
        current_user: User = Depends(get_current_user)
    ):
        try:
            # Create Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': checkout_data.price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/subscription/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/subscription/cancelled",
                customer=current_user.stripe_customer_id,
                metadata={
                    'user_id': str(current_user.id)
                }
            )
            
            return {"checkout_url": checkout_session.url}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/auth/sms-credits/checkout")
    async def buy_sms_credits(
        credits_data: SMSCreditsCheckout,
        current_user: User = Depends(get_current_user)
    ):
        try:
            # Calculate SMS messages from EUR amount (0.15 per SMS)
            sms_count = int(credits_data.amount / 0.15)
            
            # Create Stripe checkout session
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f'SMS Credits ({sms_count} messages)',
                        },
                        'unit_amount': int(credits_data.amount * 100),  # Amount in cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/sms-credits/success?session_id={CHECKOUT_SESSION_ID}",
                cancel_url=os.getenv("FRONTEND_URL", "http://localhost:3000") + "/sms-credits/cancelled",
                customer=current_user.stripe_customer_id,
                metadata={
                    'user_id': str(current_user.id),
                    'credits_amount': str(credits_data.amount)
                }
            )
            
            return {"checkout_url": checkout_session.url}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/auth/subscription/cancel")
    async def cancel_subscription(current_user: User = Depends(get_current_user)):
        session = db_manager.get_session()
        try:
            if not current_user.stripe_subscription_id:
                raise HTTPException(status_code=400, detail="No active subscription found")
            
            # Cancel the subscription at period end
            stripe.Subscription.modify(
                current_user.stripe_subscription_id,
                cancel_at_period_end=True
            )
            
            # Update user record
            user = session.query(User).filter(User.id == current_user.id).first()
            user.subscription_status = 'canceling'
            session.commit()
            
            return {"message": "Subscription will be cancelled at the end of the current period"}
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))
        finally:
            session.close()
    
    @app.post("/auth/stripe/webhook")
    async def stripe_webhook(request: dict, stripe_signature: str = Header(None)):
        # Handle Stripe webhooks for subscription updates
        # This would be implemented with proper webhook validation
        pass
    
    @app.get("/auth/saved-searches", response_model=List[dict])
    async def get_saved_searches(current_user: User = Depends(get_current_user)):
        session = db_manager.get_session()
        try:
            searches = session.query(SavedSearch).filter(
                SavedSearch.user_id == current_user.id
            ).all()
            
            return [
                {
                    "id": s.id,
                    "name": s.name,
                    "category_id": s.category_id,
                    "keywords": s.keywords,
                    "notify_email": s.notify_email,
                    "notify_push": s.notify_push,
                    "notify_sms": s.notify_sms,
                    "created_at": s.created_at
                }
                for s in searches
            ]
        finally:
            session.close()
    
    @app.post("/auth/saved-searches")
    async def create_saved_search(
        search_data: SavedSearchCreate,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            saved_search = SavedSearch(
                user_id=current_user.id,
                name=search_data.name,
                category_id=search_data.category_id,
                keywords=search_data.keywords,
                notify_email=search_data.notify_email,
                notify_push=search_data.notify_push,
                notify_sms=search_data.notify_sms
            )
            session.add(saved_search)
            session.commit()
            
            return {"message": "Search saved successfully", "id": saved_search.id}
        finally:
            session.close()
    
    @app.put("/auth/notification-preferences")
    async def update_notification_preferences(
        preferences: NotificationPreferences,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(User.id == current_user.id).first()
            user.email_notifications = preferences.email_notifications
            user.push_notifications = preferences.push_notifications
            user.sms_notifications = preferences.sms_notifications
            session.commit()
            
            return {"message": "Preferences updated successfully"}
        finally:
            session.close()
    
    @app.put("/auth/me")
    async def update_user_profile(
        update_data: dict,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(User.id == current_user.id).first()
            
            # Update allowed fields
            if 'phone_number' in update_data:
                user.phone = update_data['phone_number']
            
            session.commit()
            return {"message": "Profile updated successfully"}
        finally:
            session.close()
    
    @app.post("/auth/push-subscription")
    async def save_push_subscription(
        subscription_data: dict,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            subscription = subscription_data.get('subscription', {})
            
            # Check if subscription already exists
            existing = session.query(PushSubscription).filter(
                PushSubscription.user_id == current_user.id,
                PushSubscription.endpoint == subscription.get('endpoint')
            ).first()
            
            if not existing:
                # Create new subscription
                push_sub = PushSubscription(
                    user_id=current_user.id,
                    endpoint=subscription.get('endpoint'),
                    p256dh=subscription.get('keys', {}).get('p256dh'),
                    auth=subscription.get('keys', {}).get('auth')
                )
                session.add(push_sub)
                session.commit()
            
            return {"message": "Push subscription saved"}
        finally:
            session.close()
    
    @app.delete("/auth/push-subscription")
    async def remove_push_subscription(
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            # Remove all push subscriptions for this user
            session.query(PushSubscription).filter(
                PushSubscription.user_id == current_user.id
            ).delete()
            session.commit()
            
            return {"message": "Push subscription removed"}
        finally:
            session.close()
    
    @app.get("/auth/notification-history")
    async def get_notification_history(
        current_user: User = Depends(get_current_user),
        limit: int = 50
    ):
        session = db_manager.get_session()
        try:
            notifications = session.query(NotificationLog).filter(
                NotificationLog.user_id == current_user.id
            ).order_by(NotificationLog.sent_at.desc()).limit(limit).all()
            
            return [
                {
                    "id": n.id,
                    "post_id": n.post_id,
                    "type": n.notification_type.value,
                    "status": n.status,
                    "message": n.message,
                    "cost": n.cost,
                    "sent_at": n.sent_at
                }
                for n in notifications
            ]
        finally:
            session.close()
    
    @app.post("/auth/posts/{post_id}/mark-read")
    async def mark_post_as_read(
        post_id: int,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            # Check if already marked as read
            existing = session.query(UserReadPost).filter(
                UserReadPost.user_id == current_user.id,
                UserReadPost.post_id == post_id
            ).first()
            
            if not existing:
                read_post = UserReadPost(
                    user_id=current_user.id,
                    post_id=post_id
                )
                session.add(read_post)
                session.commit()
            
            return {"message": "Post marked as read"}
        finally:
            session.close()
    
    return app
