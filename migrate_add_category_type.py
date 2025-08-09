#!/usr/bin/env python3
"""
Migration script to add category_type column to categories table
"""
import os
from sqlalchemy import create_engine, text
from database.models import DatabaseManager, Base

def migrate():
    # Get database URL from environment or use default
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        database_url = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database/eof_scraper.db')}"
    
    print(f"Migrating database: {database_url}")
    
    # Create engine
    if database_url.startswith('sqlite'):
        engine = create_engine(database_url, connect_args={'timeout': 30})
    else:
        engine = create_engine(database_url)
    
    # Check if column already exists
    with engine.connect() as conn:
        # Check if category_type column exists
        if database_url.startswith('sqlite'):
            result = conn.execute(text("PRAGMA table_info(categories)"))
            columns = [row[1] for row in result]
        else:
            # PostgreSQL/MySQL
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'categories'
            """))
            columns = [row[0] for row in result]
        
        if 'category_type' not in columns:
            print("Adding category_type column...")
            conn.execute(text("ALTER TABLE categories ADD COLUMN category_type VARCHAR(50)"))
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("category_type column already exists, skipping migration.")

if __name__ == "__main__":
    migrate()
