#!/usr/bin/env python3
"""
Quick test to scrape first page of a few categories
"""
import logging
from database.models import DatabaseManager, Category, Post
from scraper.eof_scraper import EOFScraper

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database and scraper
db_manager = DatabaseManager()
scraper = EOFScraper(db_manager, logger)

print("\n=== Quick Test Scrape ===\n")

# Test with farmaka category (should have the most posts)
cat_info = scraper.categories.get('farmaka')
if cat_info:
    print(f"Testing with {cat_info['name']}...")
    
    # Temporarily override the pagination limit in scrape_category
    # by modifying the range limit
    original_scrape = scraper.scrape_category
    
    def limited_scrape(category_slug, category_name, category_url, parent_category=None, category_type=None):
        # Call original but it will be limited by the [:10] in the code
        # Actually, let's just parse first page
        from database.models import Category, Post, Attachment
        session = db_manager.get_session()
        
        try:
            # Get or create category
            full_url = f"{scraper.base_url}{category_url}"
            category = session.query(Category).filter_by(slug=category_slug).first()
            
            if not category:
                category = Category(
                    name=category_name,
                    slug=category_slug,
                    url=full_url,
                    parent_id=parent_category.id if parent_category else None,
                    category_type=category_type
                )
                session.add(category)
                session.commit()
            
            # Scrape just first page
            print(f"  Fetching: {full_url}")
            html = scraper.fetch_page(full_url)
            posts = scraper.parse_post_list(html, full_url)
            
            print(f"  Found {len(posts)} posts on first page")
            
            posts_new = 0
            # Process only first 5 posts for speed
            for post_data in posts[:5]:
                existing = session.query(Post).filter_by(url=post_data['url']).first()
                if not existing:
                    posts_new += 1
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
            
            session.commit()
            return len(posts[:5]), posts_new, 0
            
        except Exception as e:
            session.rollback()
            raise
        finally:
            session.close()
    
    # Run limited scrape
    try:
        scraped, new, updated = limited_scrape(
            'farmaka',
            cat_info['name'],
            cat_info['url'],
            None,
            cat_info.get('type', 'farmaka')
        )
        print(f"  ✓ Processed {scraped} posts ({new} new)")
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")

# Show stats
session = db_manager.get_session()
try:
    print("\n\nDatabase Stats:")
    print(f"  Categories: {session.query(Category).count()}")
    print(f"  Posts: {session.query(Post).count()}")
    
    for cat in session.query(Category).all():
        post_count = session.query(Post).filter_by(category_id=cat.id).count()
        print(f"  - {cat.name}: {post_count} posts")
finally:
    session.close()

print("\nYou can now test the beta dashboard at: http://localhost:8000/beta-dashboard")
print("Make sure to run: python3 api_combined.py")
