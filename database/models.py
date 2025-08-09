from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import os

Base = declarative_base()

class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    url = Column(String(500), nullable=False)
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    category_type = Column(String(50), nullable=True)  # farmaka, ktiniatrika, kallintika, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    posts = relationship("Post", back_populates="category", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_category_slug', 'slug'),
        Index('idx_category_parent', 'parent_id'),
    )

class Post(Base):
    __tablename__ = 'posts'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    url = Column(String(500), unique=True, nullable=False)
    content = Column(Text)
    excerpt = Column(Text)
    category_id = Column(Integer, ForeignKey('categories.id'))
    publish_date = Column(DateTime)
    author = Column(String(255))
    meta_description = Column(Text)
    tags = Column(Text)  # Stored as comma-separated values
    is_active = Column(Boolean, default=True)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    last_modified = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship("Category", back_populates="posts")
    attachments = relationship("Attachment", back_populates="post", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('idx_post_url', 'url'),
        Index('idx_post_category', 'category_id'),
        Index('idx_post_publish_date', 'publish_date'),
        Index('idx_post_active', 'is_active'),
    )

class Attachment(Base):
    __tablename__ = 'attachments'
    
    id = Column(Integer, primary_key=True)
    post_id = Column(Integer, ForeignKey('posts.id'))
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255))
    file_type = Column(String(50))
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    post = relationship("Post", back_populates="attachments")
    
    __table_args__ = (
        Index('idx_attachment_post', 'post_id'),
    )

class ScrapeLog(Base):
    __tablename__ = 'scrape_logs'
    
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    status = Column(String(50))  # success, failed, partial
    posts_scraped = Column(Integer, default=0)
    posts_updated = Column(Integer, default=0)
    posts_new = Column(Integer, default=0)
    errors = Column(Text)
    duration_seconds = Column(Integer)
    
    __table_args__ = (
        Index('idx_scrape_log_start', 'start_time'),
        Index('idx_scrape_log_status', 'status'),
    )

class DatabaseManager:
    def __init__(self, database_url=None):
        if not database_url:
            # Check environment variable first
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                # Default to SQLite for development
                database_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'eof_scraper.db')}"
        
        # Configure engine with SQLite-specific settings for better concurrency
        if database_url.startswith('sqlite'):
            # Add timeout and enable WAL mode for better concurrent access
            connect_args = {
                'timeout': 30,  # 30 seconds timeout
                'check_same_thread': False
            }
            self.engine = create_engine(
                database_url, 
                echo=False,
                connect_args=connect_args,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20
            )
            # Enable WAL mode for better concurrency
            with self.engine.connect() as conn:
                conn.execute(text("PRAGMA journal_mode=WAL"))
                conn.execute(text("PRAGMA busy_timeout=30000"))  # 30 seconds
                conn.commit()
        else:
            self.engine = create_engine(database_url, echo=False)
        
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    def get_session(self):
        return self.Session()
    
    def create_tables(self):
        Base.metadata.create_all(self.engine)
    
    def drop_tables(self):
        Base.metadata.drop_all(self.engine)
