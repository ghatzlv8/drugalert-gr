#!/usr/bin/env python3
"""
Direct SQLite migration to add category_type column to posts table.
"""

import sqlite3
import os
import sys

def add_category_type_column():
    """Add category_type column to posts table using direct SQLite connection."""
    # Database path
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'eof_scraper.db')
    
    if not os.path.exists(db_path):
        print(f"Database not found at: {db_path}")
        return
    
    # Connect to SQLite database
    conn = sqlite3.connect(db_path, timeout=30.0)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(posts)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'category_type' in columns:
            print("Column 'category_type' already exists in posts table")
            return
        
        # Add the column
        print("Adding 'category_type' column to posts table...")
        cursor.execute("ALTER TABLE posts ADD COLUMN category_type VARCHAR(50)")
        conn.commit()
        print("Successfully added 'category_type' column to posts table")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Starting direct SQLite migration...")
    add_category_type_column()
    print("Migration complete!")
