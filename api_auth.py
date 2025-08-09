from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
import json
from sqlalchemy.orm import Session

from database.models import DatabaseManager
from database.user_models import User, SubscriptionStatus, Payment, SavedSearch, NotificationLog, NotificationType, PushSubscription, UserReadPost, UserDevice
from database.models import Post, Category
from config.config import DATABASE_URL
from viva_payments import viva_payments

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

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
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    device_type: Optional[str] = None  # mobile, desktop, tablet

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    subscription_status: str
    trial_end_date: datetime
    trial_days_remaining: Optional[int] = None
    subscription_end_date: Optional[datetime]
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    sms_credits: float
    # Billing info
    company_name: Optional[str] = None
    tax_id: Optional[str] = None
    tax_office: Optional[str] = None
    billing_address: Optional[str] = None
    billing_city: Optional[str] = None
    billing_postal_code: Optional[str] = None
    invoice_type: Optional[str] = None
    
    class Config:
        from_attributes = True

class SubscriptionCheckout(BaseModel):
    # Empty for now, we'll create the order server-side
    pass

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
            
            # Note: We don't create Viva customer immediately - only when they subscribe
            
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
    async def login(credentials: UserLogin, request: Request):
        session = db_manager.get_session()
        try:
            user = session.query(User).filter(User.email == credentials.email).first()
            
            if not user or not verify_password(credentials.password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Device tracking - check if device_id is provided
            if credentials.device_id:
                # Check if user already has a device registered
                existing_devices = session.query(UserDevice).filter(
                    UserDevice.user_id == user.id
                ).all()
                
                # If user already has a device and it's not the current one
                if existing_devices and not any(d.device_id == credentials.device_id for d in existing_devices):
                    # Delete all existing devices (enforce one device per user)
                    for device in existing_devices:
                        session.delete(device)
                    
                    # Also remove all push subscriptions for this user
                    session.query(PushSubscription).filter(
                        PushSubscription.user_id == user.id
                    ).delete()
                
                # Check if this device is already registered
                current_device = session.query(UserDevice).filter(
                    UserDevice.user_id == user.id,
                    UserDevice.device_id == credentials.device_id
                ).first()
                
                if not current_device:
                    # Register new device
                    new_device = UserDevice(
                        user_id=user.id,
                        device_id=credentials.device_id,
                        device_name=credentials.device_name,
                        device_type=credentials.device_type,
                        user_agent=request.headers.get('User-Agent'),
                        ip_address=request.client.host if request.client else None,
                        last_login=datetime.utcnow()
                    )
                    session.add(new_device)
                else:
                    # Update last login for existing device
                    current_device.last_login = datetime.utcnow()
                    if credentials.device_name:
                        current_device.device_name = credentials.device_name
                    if credentials.device_type:
                        current_device.device_type = credentials.device_type
                    current_device.user_agent = request.headers.get('User-Agent')
                    current_device.ip_address = request.client.host if request.client else None
            
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
        current_user: User = Depends(get_current_user)
    ):
        """Create Viva payment order for annual subscription"""
        session = db_manager.get_session()
        try:
            # Create payment order with Viva
            order_result = viva_payments.create_payment_order(
                user_email=current_user.email,
                user_id=current_user.id,
                is_recurring=True  # Enable recurring for subscription
            )
            
            if not order_result:
                raise HTTPException(status_code=500, detail="Failed to create payment order")
            
            # Store the order code for reference
            user = session.query(User).filter(User.id == current_user.id).first()
            user.viva_order_code = order_result["order_code"]
            session.commit()
            
            return {
                "checkout_url": order_result["checkout_url"],
                "order_code": order_result["order_code"]
            }
        except Exception as e:
            print(f"Error creating subscription checkout: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        finally:
            session.close()
    
    @app.post("/auth/subscription/cancel")
    async def cancel_subscription(current_user: User = Depends(get_current_user)):
        """Cancel recurring subscription"""
        session = db_manager.get_session()
        try:
            if not current_user.viva_card_token:
                raise HTTPException(status_code=400, detail="No active subscription found")
            
            # Cancel the recurring payment authorization
            success = viva_payments.cancel_recurring(current_user.viva_card_token)
            
            if success:
                # Update user record
                user = session.query(User).filter(User.id == current_user.id).first()
                user.subscription_status = SubscriptionStatus.CANCELLED
                user.viva_card_token = None
                session.commit()
                
                return {"message": "Subscription cancelled successfully"}
            else:
                raise HTTPException(status_code=400, detail="Failed to cancel subscription")
                
        except Exception as e:
            print(f"Error cancelling subscription: {e}")
            raise HTTPException(status_code=400, detail=str(e))
        finally:
            session.close()
    
    @app.get("/auth/viva/webhook")
    async def viva_webhook_verification():
        """Handle Viva webhook verification GET request"""
        # Get the webhook key from environment
        verification_key = os.getenv("VIVA_WEBHOOK_KEY", "")
        
        if not verification_key:
            # Generate a new key if not set
            import secrets
            verification_key = secrets.token_urlsafe(32)
            print(f"Generated webhook verification key: {verification_key}")
            print("Please add this to your .env file as VIVA_WEBHOOK_KEY")
        
        # According to Viva docs, return the key as plain text with quotes
        # Not JSON wrapped, but the actual string with quotes
        from fastapi.responses import Response
        return Response(
            content=f'"{verification_key}"',
            media_type="text/plain",
            headers={"Cache-Control": "no-cache"}
        )
    
    @app.post("/auth/viva/webhook")
    async def viva_webhook(
        request: Request,
        authorization: str = Header(None)
    ):
        """Handle Viva payment webhooks according to their guidelines"""
        session = db_manager.get_session()
        try:
            # Get request body
            body = await request.body()
            
            # Verify webhook using Authorization header
            if not viva_payments.verify_webhook(body, authorization or ""):
                # Return 200 with error message as per Viva guidelines
                return {"status": "error", "message": "Invalid authorization"}
            
            # Parse webhook data
            webhook_data = json.loads(body)
            
            # Process webhook
            result = viva_payments.process_webhook(webhook_data)
            
            if result["success"] and result["action"] == "payment_created" and result["user_id"]:
                # Payment successful - activate subscription
                user = session.query(User).filter(User.id == result["user_id"]).first()
                if user:
                    # Store transaction info
                    user.viva_transaction_id = result["transaction_id"]
                    
                    # Create payment record
                    payment = Payment(
                        user_id=user.id,
                        amount=result["amount"] / 100,  # Convert from cents
                        currency="EUR",
                        payment_type="subscription",
                        payment_provider="viva",
                        viva_transaction_id=result["transaction_id"],
                        viva_order_code=result["order_code"],
                        status="succeeded"
                    )
                    session.add(payment)
                    
                    # Activate subscription
                    user.subscription_status = SubscriptionStatus.ACTIVE
                    user.subscription_start_date = datetime.utcnow()
                    user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
                    
                    # TODO: Get card token from transaction for recurring payments
                    # This requires additional API call to get transaction details
                    
                    session.commit()
                    
            elif result["action"] == "payment_failed":
                # Log failed payment
                if result["user_id"]:
                    payment = Payment(
                        user_id=result["user_id"],
                        amount=result["amount"] / 100 if result["amount"] else 0,
                        currency="EUR",
                        payment_type="subscription",
                        payment_provider="viva",
                        viva_transaction_id=result["transaction_id"],
                        viva_order_code=result["order_code"],
                        status="failed"
                    )
                    session.add(payment)
                    session.commit()
            
            return {"status": "ok"}
            
        except Exception as e:
            print(f"Webhook processing error: {e}")
            # Return 200 to prevent retries for processing errors
            return {"status": "error", "message": str(e)}
        finally:
            session.close()
    
    @app.get("/auth/subscription/success")
    async def subscription_success(
        order_code: str,
        current_user: User = Depends(get_current_user)
    ):
        """Handle successful payment return from Viva"""
        # The actual subscription activation happens via webhook
        # This endpoint just confirms to the user
        return {
            "message": "Payment successful! Your subscription is being activated.",
            "order_code": order_code
        }
    
    @app.get("/auth/subscription/failed")
    async def subscription_failed(
        order_code: Optional[str] = None,
        current_user: User = Depends(get_current_user)
    ):
        """Handle failed/cancelled payment return from Viva"""
        return {
            "message": "Payment was not completed. Please try again.",
            "order_code": order_code
        }
    
    # Keep all the other endpoints unchanged...
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
    
    # Admin endpoints
    @app.get("/admin/users")
    async def get_all_users(current_user: User = Depends(get_current_user)):
        """Get all users - admin only"""
        # Check if current user is admin (by email for now)
        if current_user.email != 'ghatz@lv8.gr':
            raise HTTPException(status_code=403, detail="Not authorized")
        
        session = db_manager.get_session()
        try:
            users = session.query(User).all()
            
            # Convert to dict format for JSON response
            users_data = []
            for user in users:
                users_data.append({
                    'id': user.id,
                    'email': user.email,
                    'subscription_status': user.subscription_status.value if hasattr(user.subscription_status, 'value') else str(user.subscription_status),
                    'created_at': user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat(),
                    'last_login': user.last_login.isoformat() if user.last_login else None
                })
            
            return users_data
        finally:
            session.close()

    @app.get("/admin/stats")
    async def get_admin_stats(current_user: User = Depends(get_current_user)):
        """Get admin statistics - admin only"""
        # Check if current user is admin
        if current_user.email != 'ghatz@lv8.gr':
            raise HTTPException(status_code=403, detail="Not authorized")
        
        session = db_manager.get_session()
        try:
            # Get user stats
            total_users = session.query(User).count()
            active_subscriptions = session.query(User).filter(User.subscription_status == SubscriptionStatus.ACTIVE).count()
            trial_users = session.query(User).filter(User.subscription_status == SubscriptionStatus.TRIAL).count()
            
            # Monthly revenue (active subscriptions * 14.99)
            monthly_revenue = active_subscriptions * 14.99
            
            return {
                'totalUsers': total_users,
                'activeSubscriptions': active_subscriptions,
                'trialUsers': trial_users,
                'monthlyRevenue': monthly_revenue,
                'totalPosts': 0  # We don't have posts count
            }
        finally:
            session.close()
    
    return app
