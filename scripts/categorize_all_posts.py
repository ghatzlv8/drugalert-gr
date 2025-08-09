#!/usr/bin/env python3
"""
Script to categorize all existing posts based on their category.
This will update the category_type field for all posts in the database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import DatabaseManager, Post, Category
from sqlalchemy.orm import Session
from datetime import datetime

# Define category type mappings based on the category names
CATEGORY_TYPE_MAPPINGS = {
    # Φάρμακα (Medicines)
    'Ανακλήσεις Φαρμάκων': 'farmaka',
    'Αναστολές/Ανακλήσεις Αδειών Κυκλοφορίας': 'farmaka',
    'Ελλείψεις Φαρμάκων': 'farmaka',
    'Κίνδυνοι - Προειδοποιήσεις': 'farmaka',
    
    # Κτηνιατρικά (Veterinary)
    'Ανακλήσεις Κτηνιατρικών': 'ktiniatrika',
    'Αναστολές Κτηνιατρικών': 'ktiniatrika',
    'Ελλείψεις Κτηνιατρικών': 'ktiniatrika',
    'Προειδοποιήσεις Κτηνιατρικών': 'ktiniatrika',
    
    # Καλλυντικά (Cosmetics)
    'Ανακλήσεις Καλλυντικών': 'kallintika',
    'Προειδοποιήσεις Καλλυντικών': 'kallintika',
    
    # Ιατροτεχνολογικά (Medical Devices)
    'Ανακλήσεις Ιατροτεχνολογικών': 'iatrotexnologika',
    'Προειδοποιήσεις Ιατροτεχνολογικών': 'iatrotexnologika',
    
    # Βιοκτόνα (Biocides)
    'Ανακλήσεις Βιοκτόνων': 'vioktona',
    'Προειδοποιήσεις Βιοκτόνων': 'vioktona',
    
    # Διατροφικά Προϊόντα (Dietary Products)
    'Ανακλήσεις Διατροφικών': 'diatrofika-proionta',
    'Προειδοποιήσεις Διατροφικών': 'diatrofika-proionta',
    
    # Φαρμακευτική Κάνναβη (Pharmaceutical Cannabis)
    'Ανακοινώσεις Κάνναβης': 'farmakeftiki-kannavi',
}

def categorize_posts():
    """Categorize all posts based on their category name."""
    db_manager = DatabaseManager()
    session = db_manager.get_session()
    
    try:
        # Get all categories and update their type
        categories = session.query(Category).all()
        updated_categories = 0
        
        for category in categories:
            category_type = CATEGORY_TYPE_MAPPINGS.get(category.name)
            if category_type and category.category_type != category_type:
                category.category_type = category_type
                updated_categories += 1
                print(f"Updated category '{category.name}' to type '{category_type}'")
        
        # Get all posts and update their category_type based on their category
        posts = session.query(Post).all()
        updated_posts = 0
        
        for post in posts:
            if post.category:
                category_type = CATEGORY_TYPE_MAPPINGS.get(post.category.name)
                if category_type:
                    # Check if post has category_type attribute (might need migration)
                    if hasattr(post, 'category_type'):
                        if post.category_type != category_type:
                            post.category_type = category_type
                            updated_posts += 1
                            print(f"Updated post '{post.title[:50]}...' to type '{category_type}'")
                    else:
                        print(f"Warning: Post model doesn't have category_type attribute")
        
        # Commit all changes
        session.commit()
        
        print(f"\nCategorization complete!")
        print(f"Updated {updated_categories} categories")
        print(f"Updated {updated_posts} posts")
        
        # Show summary
        print("\nCategory type summary:")
        for category_type in set(CATEGORY_TYPE_MAPPINGS.values()):
            count = session.query(Category).filter_by(category_type=category_type).count()
            print(f"  {category_type}: {count} categories")
            
    except Exception as e:
        print(f"Error during categorization: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    print("Starting post categorization...")
    categorize_posts()
