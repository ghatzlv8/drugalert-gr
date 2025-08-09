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
from database.models import Post, Category
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
    trial_days_remaining: Optional[int]
    subscription_end_date: Optional[datetime]
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    sms_credits: float
    # Billing info
    company_name: Optional[str]
    tax_id: Optional[str]
    tax_office: Optional[str]
    billing_address: Optional[str]
    billing_city: Optional[str]
    billing_postal_code: Optional[str]
    invoice_type: Optional[str]
    
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
        
        # Check if subscription is expired (try but don't fail if locked)
        try:
            if user.subscription_status == SubscriptionStatus.TRIAL:
                if datetime.utcnow() > user.trial_end_date:
                    user.subscription_status = SubscriptionStatus.EXPIRED
                    session.commit()
            elif user.subscription_status == SubscriptionStatus.ACTIVE:
                if user.subscription_end_date and datetime.utcnow() > user.subscription_end_date:
                    user.subscription_status = SubscriptionStatus.EXPIRED
                    session.commit()
        except Exception as e:
            print(f"Warning: Could not update subscription status: {e}")
            session.rollback()
        
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
            
            # Calculate trial days remaining for new user (should be 4)
            trial_days_remaining = None
            if new_user.subscription_status == SubscriptionStatus.TRIAL:
                time_remaining = new_user.trial_end_date - datetime.utcnow()
                if time_remaining.total_seconds() > 0:
                    trial_days_remaining = int(time_remaining.total_seconds() / 86400) + (1 if time_remaining.total_seconds() % 86400 > 0 else 0)
                else:
                    trial_days_remaining = 0
            
            # Create user response with trial_days_remaining
            user_data = UserResponse.from_orm(new_user).dict()
            user_data['trial_days_remaining'] = trial_days_remaining
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_data
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
            
            # Update last login (try but don't fail if locked)
            try:
                user.last_login = datetime.utcnow()
                session.commit()
            except Exception as e:
                print(f"Warning: Could not update last_login: {e}")
                session.rollback()
            
            # Create access token
            access_token = create_access_token({"sub": str(user.id)})
            
            # Calculate trial days remaining
            trial_days_remaining = None
            if user.subscription_status == SubscriptionStatus.TRIAL:
                time_remaining = user.trial_end_date - datetime.utcnow()
                if time_remaining.total_seconds() > 0:
                    trial_days_remaining = int(time_remaining.total_seconds() / 86400) + (1 if time_remaining.total_seconds() % 86400 > 0 else 0)
                else:
                    trial_days_remaining = 0
            
            # Create user response with trial_days_remaining
            user_data = UserResponse.from_orm(user).dict()
            user_data['trial_days_remaining'] = trial_days_remaining
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user_data
            }
        finally:
            session.close()
    
    @app.get("/auth/me", response_model=UserResponse)
    async def get_me(current_user: User = Depends(get_current_user)):
        # Calculate trial days remaining
        trial_days_remaining = None
        if current_user.subscription_status == SubscriptionStatus.TRIAL:
            time_remaining = current_user.trial_end_date - datetime.utcnow()
            if time_remaining.total_seconds() > 0:
                # Round up to show full days
                trial_days_remaining = int(time_remaining.total_seconds() / 86400) + (1 if time_remaining.total_seconds() % 86400 > 0 else 0)
            else:
                trial_days_remaining = 0
        
        # Create response with calculated trial_days_remaining
        user_data = UserResponse.from_orm(current_user).dict()
        user_data['trial_days_remaining'] = trial_days_remaining
        return user_data
    
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
    
    @app.put("/auth/billing-info")
    async def update_billing_info(
        billing_data: dict,
        current_user: User = Depends(get_current_user)
    ):
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(User.id == current_user.id).first()
            
            # Update billing fields
            if 'company_name' in billing_data:
                user.company_name = billing_data['company_name']
            if 'tax_id' in billing_data:
                user.tax_id = billing_data['tax_id']
            if 'tax_office' in billing_data:
                user.tax_office = billing_data['tax_office']
            if 'billing_address' in billing_data:
                user.billing_address = billing_data['billing_address']
            if 'billing_city' in billing_data:
                user.billing_city = billing_data['billing_city']
            if 'billing_postal_code' in billing_data:
                user.billing_postal_code = billing_data['billing_postal_code']
            if 'invoice_type' in billing_data:
                user.invoice_type = billing_data['invoice_type']
            
            session.commit()
            return {"message": "Billing info updated successfully"}
        finally:
            session.close()
    
    @app.get("/auth/subscription-status")
    async def get_subscription_status(current_user: User = Depends(get_current_user)):
        """Get current user's subscription status"""
        now = datetime.utcnow()
        
        # Check if user is in trial period
        in_trial = (
            current_user.subscription_status == SubscriptionStatus.TRIAL and
            current_user.trial_end_date > now
        )
        
        # Check if user has active subscription
        is_premium = (
            current_user.subscription_status == SubscriptionStatus.ACTIVE or
            in_trial
        )
        
        # Calculate days remaining
        days_remaining = 0
        if in_trial:
            days_remaining = (current_user.trial_end_date - now).days
        elif current_user.subscription_status == SubscriptionStatus.ACTIVE and current_user.subscription_end_date:
            days_remaining = (current_user.subscription_end_date - now).days
        
        return {
            "is_premium": is_premium,
            "in_trial": in_trial,
            "subscription_status": current_user.subscription_status.value if hasattr(current_user.subscription_status, 'value') else current_user.subscription_status,
            "days_remaining": max(0, days_remaining),
            "trial_end_date": current_user.trial_end_date.isoformat() if current_user.trial_end_date else None,
            "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None,
            "can_use_push_notifications": is_premium
        }
    
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
    
    @app.get("/user/dashboard")
    async def get_user_dashboard(current_user: User = Depends(get_current_user)):
        """Get dashboard stats for the current user"""
        session = db_manager.get_session()
        try:
            # Get total posts count
            total_posts = session.query(Post).count()
            
            # Get read posts by user
            read_posts_ids = session.query(UserReadPost.post_id).filter(
                UserReadPost.user_id == current_user.id
            ).subquery()
            
            # Get unread posts count
            unread_posts = session.query(Post).filter(
                ~Post.id.in_(read_posts_ids)
            ).count()
            
            # Get categories count
            categories_count = session.query(Category).count()
            
            # Get recent posts (last 10)
            recent_posts = session.query(Post).join(Category).filter(
                ~Post.id.in_(read_posts_ids)
            ).order_by(Post.publish_date.desc()).limit(10).all()
            
            # Format recent posts
            recent_posts_data = []
            for post in recent_posts:
                recent_posts_data.append({
                    "id": post.id,
                    "title": post.title,
                    "content": post.content[:200] + "..." if post.content and len(post.content) > 200 else post.content,
                    "published_date": post.publish_date.isoformat() if post.publish_date else None,
                    "category_id": post.category_id,
                    "is_read": False,
                    "category": {
                        "name": post.category.name if post.category else None,
                        "slug": post.category.slug if post.category else None
                    }
                })
            
            # Calculate trial days remaining
            trial_days_remaining = 0
            if current_user.subscription_status == SubscriptionStatus.TRIAL:
                # Calculate remaining time and round up to show full days
                time_remaining = current_user.trial_end_date - datetime.utcnow()
                trial_days_remaining = max(0, int(time_remaining.total_seconds() / 86400) + (1 if time_remaining.total_seconds() % 86400 > 0 else 0))
            
            return {
                "total_posts": total_posts,
                "unread_posts": unread_posts,
                "categories": categories_count,
                "recent_posts": recent_posts_data,
                "user": {
                    "email": current_user.email,
                    "subscription_status": current_user.subscription_status.value if hasattr(current_user.subscription_status, 'value') else current_user.subscription_status,
                    "trial_days_remaining": trial_days_remaining
                }
            }
        finally:
            session.close()
    
    @app.post("/user/posts/{post_id}/read")
    async def mark_post_read(
        post_id: int,
        current_user: User = Depends(get_current_user)
    ):
        """Mark a post as read by the current user"""
        session = db_manager.get_session()
        try:
            # Check if post exists
            post = session.query(Post).filter(Post.id == post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            
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
    
    @app.post("/share-invite")
    async def send_share_invite(
        invite_data: dict,
        current_user: User = Depends(get_current_user)
    ):
        """Send an invitation to a friend to join the platform and view a specific post"""
        email = invite_data.get("email")
        post_id = invite_data.get("post_id")
        message = invite_data.get("message", "")
        
        if not email or not post_id:
            raise HTTPException(status_code=400, detail="Email and post_id are required")
        
        session = db_manager.get_session()
        try:
            # Get the post details
            post = session.query(Post).filter(Post.id == post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            
            # Here you would typically send an email invitation
            # For now, we'll just log it and return success
            # In production, integrate with an email service like SendGrid, AWS SES, etc.
            
            # Log the invitation
            print(f"Share invitation sent from {current_user.email} to {email} for post {post_id}")
            print(f"Post title: {post.title}")
            print(f"Personal message: {message}")
            
            # In a real implementation, you would:
            # 1. Generate a unique invitation token
            # 2. Store it in an invitations table with expiry
            # 3. Send an email with a link like: https://drugalert.gr/signup?invite=TOKEN&post=POST_ID
            # 4. When the recipient signs up using that link, they would automatically see the shared post
            
            return {
                "message": "Invitation sent successfully",
                "recipient": email,
                "post_title": post.title,
                "sender": current_user.email
            }
        except Exception as e:
            print(f"Error sending invitation: {e}")
            raise HTTPException(status_code=500, detail="Failed to send invitation")
        finally:
            session.close()
    
    return app
