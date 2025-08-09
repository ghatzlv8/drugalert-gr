#!/usr/bin/env python3
"""
Migration script to add billing fields to the users table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config.config import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Add billing info columns to users table
        billing_columns = [
            "ALTER TABLE users ADD COLUMN company_name VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN tax_id VARCHAR(20)",
            "ALTER TABLE users ADD COLUMN tax_office VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN billing_address TEXT",
            "ALTER TABLE users ADD COLUMN billing_city VARCHAR(100)",
            "ALTER TABLE users ADD COLUMN billing_postal_code VARCHAR(10)",
            "ALTER TABLE users ADD COLUMN invoice_type VARCHAR(20) DEFAULT 'receipt'"
        ]
        
        for sql in billing_columns:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"Successfully executed: {sql}")
            except Exception as e:
                if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"Column already exists, skipping: {sql}")
                else:
                    print(f"Error executing {sql}: {e}")
                    
if __name__ == "__main__":
    print("Running billing fields migration...")
    migrate()
    print("Migration completed!")
