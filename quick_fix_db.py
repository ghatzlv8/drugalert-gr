#!/usr/bin/env python3
import sqlite3
import time
import sys
import os

# Kill the API process first
os.system("pkill -f api_combined.py")
time.sleep(3)

db_path = "database/eof_scraper.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(users)")
existing_columns = [col[1] for col in cursor.fetchall()]
print(f"Existing columns: {existing_columns}")

# Define columns to add
columns_to_add = [
    ("company_name", "TEXT"),
    ("tax_id", "VARCHAR(20)"),
    ("tax_office", "VARCHAR(100)"),
    ("billing_address", "TEXT"),
    ("billing_city", "VARCHAR(100)")
]

# Add missing columns
for col_name, col_type in columns_to_add:
    if col_name not in existing_columns:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            print(f"Added column: {col_name}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")

conn.commit()
conn.close()

print("Database fixed!")

# Restart the API
os.system("nohup ./venv/bin/python api_combined.py > logs/api.log 2>&1 &")
print("API restarted!")
