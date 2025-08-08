#!/usr/bin/env python3
"""
Add user_sessions table for session management
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import Base, engine
from database.session_models import UserSession

def create_sessions_table():
    """Create the user_sessions table"""
    print("Creating user_sessions table...")
    Base.metadata.create_all(bind=engine, tables=[UserSession.__table__])
    print("✓ user_sessions table created successfully")

if __name__ == "__main__":
    create_sessions_table()
