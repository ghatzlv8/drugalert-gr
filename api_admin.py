"""
Admin API endpoints for user management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database.models import get_db
from database.user_models import User
from api_auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime
    subscription_status: str
    trial_end_date: Optional[datetime]
    subscription_end_date: Optional[datetime]
    email_notifications: bool
    push_notifications: bool
    sms_notifications: bool
    sms_credits: float
    phone: Optional[str]
    referral_source: Optional[str]
    utm_source: Optional[str]
    utm_medium: Optional[str]
    utm_campaign: Optional[str]
    last_login: Optional[datetime]
    login_count: int

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    is_active: Optional[bool]
    is_admin: Optional[bool]
    subscription_status: Optional[str]
    subscription_end_date: Optional[datetime]
    sms_credits: Optional[float]

def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify current user is admin"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = Query(default=50, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get all users with optional search"""
    query = db.query(User)
    
    if search:
        query = query.filter(
            (User.email.contains(search)) | 
            (User.full_name.contains(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get specific user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Update user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Get admin dashboard statistics"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    trial_users = db.query(User).filter(User.subscription_status == "trial").count()
    paid_users = db.query(User).filter(User.subscription_status == "active").count()
    
    # Get referral sources
    referral_stats = db.query(
        User.referral_source, 
        db.func.count(User.id).label('count')
    ).group_by(User.referral_source).all()
    
    # Get recent signups
    recent_signups = db.query(User)\
        .order_by(User.created_at.desc())\
        .limit(10)\
        .all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "trial_users": trial_users,
        "paid_users": paid_users,
        "referral_sources": [
            {"source": r[0] or "direct", "count": r[1]} 
            for r in referral_stats
        ],
        "recent_signups": [
            {
                "id": u.id,
                "email": u.email,
                "created_at": u.created_at,
                "referral_source": u.referral_source
            }
            for u in recent_signups
        ]
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Delete a user (soft delete - sets is_active to False)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    user.is_active = False
    db.commit()
    
    return {"message": "User deactivated successfully"}
