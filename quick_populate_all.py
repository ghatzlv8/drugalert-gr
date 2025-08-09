#!/usr/bin/env python3
"""
Quick script to populate at least one page of posts for each category
"""
import logging
from database.models import DatabaseManager
from scraper.eof_scraper import EOFScraper

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database and scraper
db_manager = DatabaseManager()
scraper = EOFScraper(db_manager, logger)

print("\n=== Quick Population of All Categories ===\n")

# Process each main category
for cat_slug, cat_info in scraper.categories.items():
    print(f"\nProcessing {cat_info['name']} ({cat_slug})...")
    
    try:
        # Just scrape the first page of posts
        from database.models import Category, Post
        session = db_manager.get_session()
        
        # Get or create category
        category = session.query(Category).filter_by(slug=cat_slug).first()
        if not category:
            category = Category(
                name=cat_info['name'],
                slug=cat_slug,
                url=cat_info['url'],
                category_type=cat_info.get('type', cat_slug)
            )
            session.add(category)
            session.commit()
        
        # Fetch and parse first page only
        full_url = f"{scraper.base_url}{cat_info['url']}"
        html = scraper.fetch_page(full_url)
        posts = scraper.parse_post_list(html, full_url)
        
        # Process first 3 posts only for speed
        new_count = 0
        for post_data in posts[:3]:
            existing = session.query(Post).filter_by(url=post_data['url']).first()
            if not existing:
                try:
                    # Fetch full content
                    post_html = scraper.fetch_page(post_data['url'])
                    content_data = scraper.parse_post_content(post_html, post_data['url'])
                    
                    new_post = Post(
                        title=post_data['title'],
                        url=post_data['url'],
                        content=content_data['content'],
                        excerpt=post_data.get('excerpt', ''),
                        category_id=category.id,
                        publish_date=post_data.get('publish_date'),
                        meta_description=content_data['meta_description'],
                        tags=content_data['tags']
                    )
                    session.add(new_post)
                    new_count += 1
                except Exception as e:
                    print(f"    Error processing post: {e}")
                    continue
        
        session.commit()
        session.close()
        print(f"  ✓ Added {new_count} posts")
        
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")

# Show final stats
session = db_manager.get_session()
print("\n\nFinal Database Stats:")
print(f"  Total categories: {session.query(Category).count()}")
print(f"  Total posts: {session.query(Post).count()}")

print("\nPosts by category type:")
for cat in session.query(Category).filter(Category.parent_id == None).all():
    post_count = session.query(Post).filter_by(category_id=cat.id).count()
    print(f"  {cat.name} ({cat.category_type}): {post_count} posts")
session.close()
