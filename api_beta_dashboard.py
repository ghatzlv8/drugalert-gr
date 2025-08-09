from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from sqlalchemy.orm import joinedload
from collections import defaultdict
import calendar

from database.models import DatabaseManager, Category, Post, Attachment
from config.config import DATABASE_URL

# Initialize router
router = APIRouter()

# Initialize templates
templates = Jinja2Templates(directory="templates")

# Initialize database
db_manager = DatabaseManager(DATABASE_URL)

# Category type names mapping
CATEGORY_TYPE_NAMES = {
    'farmaka': 'Φάρμακα',
    'ktiniatrika': 'Κτηνιατρικά',
    'kallintika': 'Καλλυντικά',
    'iatrotexnologika': 'Ιατροτεχνολογικά',
    'vioktona': 'Βιοκτόνα',
    'diatrofika': 'Διατροφικά',
    'kannavi': 'Φαρμακευτική Κάνναβη'
}

@router.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the index page"""
    return templates.TemplateResponse("index.html", {"request": request})

@router.get("/beta-dashboard", response_class=HTMLResponse)
async def beta_dashboard(request: Request):
    """Render the beta dashboard with aggregated statistics"""
    session = db_manager.get_session()
    try:
        # Calculate statistics
        total_categories = session.query(Category).count()
        main_categories = session.query(Category).filter(Category.parent_id == None).count()
        subcategories = session.query(Category).filter(Category.parent_id != None).count()
        
        total_posts = session.query(Post).count()
        
        # Recent posts (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_posts_count = session.query(Post).filter(
            Post.publish_date >= seven_days_ago
        ).count()
        
        # Total attachments
        total_attachments = session.query(Attachment).count()
        
        stats = {
            'total_categories': total_categories,
            'main_categories': main_categories,
            'subcategories': subcategories,
            'total_posts': total_posts,
            'recent_posts': recent_posts_count,
            'total_attachments': total_attachments
        }
        
        # Get categories by type with post counts
        categories_by_type = defaultdict(list)
        
        # Get all main categories with their post counts
        main_cats = session.query(Category).filter(Category.parent_id == None).all()
        
        for cat in main_cats:
            cat_type = cat.category_type or 'unknown'
            
            # Get post count for this category
            post_count = session.query(Post).filter(Post.category_id == cat.id).count()
            
            # Get subcategories
            subcats = session.query(Category).filter(Category.parent_id == cat.id).all()
            subcategory_data = []
            
            for subcat in subcats:
                subcat_post_count = session.query(Post).filter(Post.category_id == subcat.id).count()
                subcategory_data.append({
                    'id': subcat.id,
                    'name': subcat.name,
                    'slug': subcat.slug,
                    'post_count': subcat_post_count
                })
            
            category_info = {
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'post_count': post_count,
                'subcategories': subcategory_data
            }
            
            categories_by_type[cat_type].append(category_info)
        
        # Prepare data for category type pie chart
        category_type_data = {
            'labels': [],
            'values': []
        }
        
        for cat_type, type_name in CATEGORY_TYPE_NAMES.items():
            post_count = session.query(Post).join(Category).filter(
                Category.category_type == cat_type
            ).count()
            if post_count > 0:
                category_type_data['labels'].append(type_name)
                category_type_data['values'].append(post_count)
        
        # Prepare monthly posts data (last 6 months)
        monthly_data = {
            'labels': [],
            'values': []
        }
        
        current_date = datetime.utcnow()
        for i in range(5, -1, -1):
            month_date = current_date - timedelta(days=30*i)
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # Get last day of month
            if month_start.month == 12:
                month_end = month_start.replace(year=month_start.year+1, month=1, day=1) - timedelta(seconds=1)
            else:
                month_end = month_start.replace(month=month_start.month+1, day=1) - timedelta(seconds=1)
            
            post_count = session.query(Post).filter(
                and_(Post.publish_date >= month_start, Post.publish_date <= month_end)
            ).count()
            
            month_name = calendar.month_name[month_start.month][:3]
            monthly_data['labels'].append(f"{month_name} {month_start.year}")
            monthly_data['values'].append(post_count)
        
        # Get recent posts
        recent_posts = session.query(Post).options(
            joinedload(Post.category)
        ).order_by(Post.publish_date.desc()).limit(20).all()
        
        return templates.TemplateResponse("beta_dashboard.html", {
            "request": request,
            "stats": stats,
            "categories_by_type": dict(categories_by_type),
            "category_type_names": CATEGORY_TYPE_NAMES,
            "category_type_data": category_type_data,
            "monthly_data": monthly_data,
            "recent_posts": recent_posts
        })
        
    finally:
        session.close()

def create_beta_dashboard_route(app):
    """Add beta dashboard route to the main app"""
    app.include_router(router)
