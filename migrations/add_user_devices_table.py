#!/usr/bin/env python3
"""
Migration script to add user_devices table for device tracking
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from config.config import DATABASE_URL

def migrate():
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Create user_devices table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS user_devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                device_id VARCHAR(255) NOT NULL,
                device_name VARCHAR(255),
                device_type VARCHAR(50),
                user_agent TEXT,
                ip_address VARCHAR(45),
                last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE(user_id, device_id)
            )
        """))
        conn.commit()
        print("Successfully created user_devices table")
        
        # Create index for faster lookups
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id)
        """))
        conn.commit()
        print("Successfully created index on user_devices")
                    
if __name__ == "__main__":
    print("Running user devices table migration...")
    migrate()
    print("Migration completed!")
