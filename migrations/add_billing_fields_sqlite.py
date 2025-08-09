#!/usr/bin/env python3
"""
Migration script to add billing fields to the SQLite users table
"""
import sqlite3
import os

def migrate():
    # Get the database path
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'database', 'eof_scraper.db')
    
    print(f"Connecting to database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add billing info columns to users table
    billing_columns = [
        ("company_name", "TEXT"),
        ("tax_id", "VARCHAR(20)"),
        ("tax_office", "VARCHAR(100)"),
        ("billing_address", "TEXT"),
        ("billing_city", "VARCHAR(100)"),
        ("billing_postal_code", "VARCHAR(10)"),
        ("invoice_type", "VARCHAR(20) DEFAULT 'receipt'")
    ]
    
    for column_name, column_type in billing_columns:
        try:
            sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
            cursor.execute(sql)
            conn.commit()
            print(f"Successfully added column: {column_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {column_name} already exists, skipping")
            else:
                print(f"Error adding column {column_name}: {e}")
    
    conn.close()
    print("Migration completed!")
                    
if __name__ == "__main__":
    print("Running SQLite billing fields migration...")
    migrate()
