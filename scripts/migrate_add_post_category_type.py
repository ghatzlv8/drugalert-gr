#!/usr/bin/env python3
"""
Migration script to add category_type column to posts table.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import DatabaseManager
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

def add_post_category_type_column():
    """Add category_type column to posts table if it doesn't exist."""
    db_manager = DatabaseManager()
    session = db_manager.get_session()
    
    try:
        # Check if column already exists
        result = session.execute(text("PRAGMA table_info(posts)"))
        columns = [row[1] for row in result]
        
        if 'category_type' in columns:
            print("Column 'category_type' already exists in posts table")
            return
        
        # Add the column
        print("Adding 'category_type' column to posts table...")
        session.execute(text("ALTER TABLE posts ADD COLUMN category_type VARCHAR(50)"))
        session.commit()
        print("Successfully added 'category_type' column to posts table")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Starting migration: Adding category_type to posts table...")
    add_post_category_type_column()
    print("Migration complete!")
