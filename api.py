from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import joinedload
import uvicorn

from database.models import DatabaseManager, Category, Post, Attachment, ScrapeLog
from config.config import API_CONFIG, DATABASE_URL

# Pydantic models for API responses
class AttachmentResponse(BaseModel):
    id: int
    file_url: str
    file_name: Optional[str]
    file_type: Optional[str]
    
    class Config:
        from_attributes = True

class PostResponse(BaseModel):
    id: int
    title: str
    url: str
    content: Optional[str]
    excerpt: Optional[str]
    publish_date: Optional[datetime]
    tags: Optional[str]
    category_id: Optional[int]
    category_name: Optional[str]
    attachments: List[AttachmentResponse] = []
    scraped_at: datetime
    
    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    url: str
    parent_id: Optional[int]
    post_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

class ScrapeLogResponse(BaseModel):
    id: int
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    posts_scraped: int
    posts_new: int
    posts_updated: int
    duration_seconds: Optional[int]
    
    class Config:
        from_attributes = True

# Initialize FastAPI app
app = FastAPI(
    title="EOF Scraper API",
    description="API for accessing scraped data from EOF website",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_CONFIG['cors_origins'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db_manager = DatabaseManager(DATABASE_URL)

@app.get("/")
def read_root():
    return {
        "name": "EOF Scraper API",
        "version": "1.0.0",
        "status": "active"
    }

@app.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    parent_id: Optional[int] = None,
    include_counts: bool = False
):
    """Get all categories, optionally filtered by parent_id"""
    session = db_manager.get_session()
    try:
        query = session.query(Category)
        
        if parent_id is not None:
            query = query.filter(Category.parent_id == parent_id)
        
        categories = query.all()
        
        response = []
        for cat in categories:
            cat_dict = {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "url": cat.url,
                "parent_id": cat.parent_id
            }
            
            if include_counts:
                cat_dict["post_count"] = session.query(Post).filter(Post.category_id == cat.id).count()
            
            response.append(CategoryResponse(**cat_dict))
        
        return response
    finally:
        session.close()

@app.get("/categories/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int):
    """Get a specific category by ID"""
    session = db_manager.get_session()
    try:
        category = session.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return CategoryResponse(
            id=category.id,
            name=category.name,
            slug=category.slug,
            url=category.url,
            parent_id=category.parent_id,
            post_count=session.query(Post).filter(Post.category_id == category.id).count()
        )
    finally:
        session.close()

@app.get("/posts", response_model=List[PostResponse])
def get_posts(
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("publish_date", regex="^(publish_date|title|scraped_at)$"),
    order: str = Query("desc", regex="^(asc|desc)$")
):
    """Get posts with pagination and filtering"""
    session = db_manager.get_session()
    try:
        query = session.query(Post).options(joinedload(Post.attachments), joinedload(Post.category))
        
        # Apply filters
        if category_id:
            query = query.filter(Post.category_id == category_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Post.title.ilike(search_term)) |
                (Post.content.ilike(search_term))
            )
        
        # Apply sorting
        sort_column = getattr(Post, sort_by)
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        posts = query.offset(skip).limit(limit).all()
        
        # Format response
        response = []
        for post in posts:
            post_dict = {
                "id": post.id,
                "title": post.title,
                "url": post.url,
                "content": post.content,
                "excerpt": post.excerpt,
                "publish_date": post.publish_date,
                "tags": post.tags,
                "category_id": post.category_id,
                "category_name": post.category.name if post.category else None,
                "scraped_at": post.scraped_at,
                "attachments": [
                    AttachmentResponse(
                        id=att.id,
                        file_url=att.file_url,
                        file_name=att.file_name,
                        file_type=att.file_type
                    ) for att in post.attachments
                ]
            }
            response.append(PostResponse(**post_dict))
        
        return response
    finally:
        session.close()

@app.get("/posts/{post_id}", response_model=PostResponse)
def get_post(post_id: int):
    """Get a specific post by ID"""
    session = db_manager.get_session()
    try:
        post = session.query(Post).options(
            joinedload(Post.attachments),
            joinedload(Post.category)
        ).filter(Post.id == post_id).first()
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        return PostResponse(
            id=post.id,
            title=post.title,
            url=post.url,
            content=post.content,
            excerpt=post.excerpt,
            publish_date=post.publish_date,
            tags=post.tags,
            category_id=post.category_id,
            category_name=post.category.name if post.category else None,
            scraped_at=post.scraped_at,
            attachments=[
                AttachmentResponse(
                    id=att.id,
                    file_url=att.file_url,
                    file_name=att.file_name,
                    file_type=att.file_type
                ) for att in post.attachments
            ]
        )
    finally:
        session.close()

@app.get("/posts/recent", response_model=List[PostResponse])
def get_recent_posts(limit: int = Query(10, ge=1, le=50)):
    """Get most recently scraped posts"""
    return get_posts(limit=limit, sort_by="scraped_at", order="desc")

@app.get("/scrape-logs", response_model=List[ScrapeLogResponse])
def get_scrape_logs(
    status: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100)
):
    """Get scrape logs"""
    session = db_manager.get_session()
    try:
        query = session.query(ScrapeLog)
        
        if status:
            query = query.filter(ScrapeLog.status == status)
        
        logs = query.order_by(ScrapeLog.start_time.desc()).limit(limit).all()
        
        return [
            ScrapeLogResponse(
                id=log.id,
                start_time=log.start_time,
                end_time=log.end_time,
                status=log.status,
                posts_scraped=log.posts_scraped,
                posts_new=log.posts_new,
                posts_updated=log.posts_updated,
                duration_seconds=log.duration_seconds
            ) for log in logs
        ]
    finally:
        session.close()

@app.get("/stats")
def get_stats():
    """Get overall statistics"""
    session = db_manager.get_session()
    try:
        total_posts = session.query(Post).count()
        total_categories = session.query(Category).count()
        total_attachments = session.query(Attachment).count()
        
        # Get last successful scrape
        last_scrape = session.query(ScrapeLog).filter(
            ScrapeLog.status == 'success'
        ).order_by(ScrapeLog.start_time.desc()).first()
        
        return {
            "total_posts": total_posts,
            "total_categories": total_categories,
            "total_attachments": total_attachments,
            "last_successful_scrape": last_scrape.end_time if last_scrape else None,
            "last_scrape_posts": last_scrape.posts_scraped if last_scrape else 0
        }
    finally:
        session.close()

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host=API_CONFIG['host'],
        port=API_CONFIG['port'],
        reload=API_CONFIG['debug']
    )
