from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database.user_models import User
from api_auth import get_current_user

router = APIRouter()

@router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users - admin only"""
    # Check if current user is admin (by email for now)
    if current_user.email != 'admin@drugalert.gr':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from api_auth import db_manager
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
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'sms_credits': user.sms_credits or 0
            })
        
        return users_data
    finally:
        session.close()

@router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    """Get admin statistics - admin only"""
    # Check if current user is admin
    if current_user.email != 'admin@drugalert.gr':
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from api_auth import db_manager
    session = db_manager.get_session()
    try:
        # Get user stats
        total_users = session.query(User).count()
        active_subscriptions = session.query(User).filter(User.subscription_status == 'active').count()
        trial_users = session.query(User).filter(User.subscription_status == 'trial').count()
        
        # Calculate total SMS credits
        total_sms_credits = 0
        all_users = session.query(User).all()
        for user in all_users:
            if user.sms_credits:
                total_sms_credits += user.sms_credits
        
        # Monthly revenue (active subscriptions * 14.99)
        monthly_revenue = active_subscriptions * 14.99
        
        return {
            'totalUsers': total_users,
            'activeSubscriptions': active_subscriptions,
            'trialUsers': trial_users,
            'monthlyRevenue': monthly_revenue,
            'totalPosts': 0,  # We don't have posts count
            'totalSmsCredits': float(total_sms_credits)
        }
    finally:
        session.close()
