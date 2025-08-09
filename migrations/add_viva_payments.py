#!/usr/bin/env python3
"""
Add Viva Payments fields to database
"""
import sys
sys.path.append('..')

from database.models import DatabaseManager
from config.config import DATABASE_URL
import sqlite3

def migrate():
    """Add Viva Payments columns to users and payments tables"""
    
    # Connect directly to SQLite
    conn = sqlite3.connect(DATABASE_URL.replace('sqlite:///', ''))
    cursor = conn.cursor()
    
    try:
        # Add Viva fields to users table
        print("Adding Viva fields to users table...")
        
        # Check which columns already exist
        cursor.execute("PRAGMA table_info(users)")
        existing_columns = [col[1] for col in cursor.fetchall()]
        
        viva_user_columns = [
            ("viva_customer_id", "VARCHAR(255)"),
            ("viva_order_code", "VARCHAR(255)"),
            ("viva_transaction_id", "VARCHAR(255)"),
            ("viva_card_token", "VARCHAR(255)")
        ]
        
        for col_name, col_type in viva_user_columns:
            if col_name not in existing_columns:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                print(f"  ✓ Added {col_name}")
            else:
                print(f"  - {col_name} already exists")
        
        # Add fields to payments table
        print("\nAdding fields to payments table...")
        
        cursor.execute("PRAGMA table_info(payments)")
        existing_payment_columns = [col[1] for col in cursor.fetchall()]
        
        payment_columns = [
            ("payment_provider", "VARCHAR(20) DEFAULT 'stripe'"),
            ("viva_transaction_id", "VARCHAR(255)"),
            ("viva_order_code", "VARCHAR(255)")
        ]
        
        for col_name, col_type in payment_columns:
            if col_name not in existing_payment_columns:
                cursor.execute(f"ALTER TABLE payments ADD COLUMN {col_name} {col_type}")
                print(f"  ✓ Added {col_name}")
            else:
                print(f"  - {col_name} already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
