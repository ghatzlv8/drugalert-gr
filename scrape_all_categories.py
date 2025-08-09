#!/usr/bin/env python3
"""
Script to scrape all EOF categories
"""
import logging
from datetime import datetime
from database.models import DatabaseManager
from scraper.eof_scraper import EOFScraper

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def scrape_all_categories():
    # Initialize database and scraper
    db_manager = DatabaseManager()
    scraper = EOFScraper(db_manager, logger)
    
    print("\n=== Starting Full EOF Category Scrape ===\n")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Categories to scrape: {len(scraper.categories)}")
    print("=" * 50)
    
    # Track overall statistics
    total_categories = 0
    total_posts_scraped = 0
    total_posts_new = 0
    total_posts_updated = 0
    total_errors = 0
    
    # Scrape each category
    for cat_slug, cat_info in scraper.categories.items():
        print(f"\n\nCategory: {cat_info['name']} ({cat_slug})")
        print(f"  Type: {cat_info.get('type', 'unknown')}")
        print(f"  URL: {cat_info['url']}")
        print(f"  Subcategories: {len(cat_info.get('subcategories', {}))}")
        
        try:
            # Scrape main category
            posts_scraped, posts_new, posts_updated = scraper.scrape_category(
                category_slug=cat_slug,
                category_name=cat_info['name'],
                category_url=cat_info['url'],
                parent_category=None,
                category_type=cat_info.get('type', cat_slug)
            )
            
            print(f"  ✓ Main category complete: {posts_scraped} scraped, {posts_new} new, {posts_updated} updated")
            
            total_categories += 1
            total_posts_scraped += posts_scraped
            total_posts_new += posts_new
            total_posts_updated += posts_updated
            
            # Scrape subcategories if any
            subcategories = cat_info.get('subcategories', {})
            if subcategories:
                print(f"  Scraping {len(subcategories)} subcategories...")
                
                # Get parent category from database
                session = db_manager.get_session()
                try:
                    from database.models import Category
                    parent_cat = session.query(Category).filter_by(slug=cat_slug).first()
                    
                    for subcat_slug, subcat_name in subcategories.items():
                        subcat_url = f"{cat_info['url']}{subcat_slug}/"
                        print(f"    - {subcat_name} ({subcat_slug})...")
                        
                        try:
                            sub_scraped, sub_new, sub_updated = scraper.scrape_category(
                                category_slug=subcat_slug,
                                category_name=subcat_name,
                                category_url=subcat_url,
                                parent_category=parent_cat,
                                category_type=cat_info.get('type', cat_slug)
                            )
                            
                            print(f"      ✓ {sub_scraped} scraped, {sub_new} new, {sub_updated} updated")
                            
                            total_categories += 1
                            total_posts_scraped += sub_scraped
                            total_posts_new += sub_new
                            total_posts_updated += sub_updated
                            
                        except Exception as e:
                            print(f"      ✗ Error: {str(e)}")
                            total_errors += 1
                            logger.exception(f"Error scraping subcategory {subcat_slug}")
                            
                finally:
                    session.close()
                    
        except Exception as e:
            print(f"  ✗ Error scraping category: {str(e)}")
            total_errors += 1
            logger.exception(f"Error scraping category {cat_slug}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("SCRAPING COMPLETE")
    print("=" * 50)
    print(f"End time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\nSummary:")
    print(f"  Categories processed: {total_categories}")
    print(f"  Total posts scraped: {total_posts_scraped}")
    print(f"  New posts: {total_posts_new}")
    print(f"  Updated posts: {total_posts_updated}")
    print(f"  Errors: {total_errors}")
    
    # Show database statistics
    session = db_manager.get_session()
    try:
        from database.models import Category, Post
        
        db_categories = session.query(Category).count()
        db_posts = session.query(Post).count()
        
        print(f"\nDatabase totals:")
        print(f"  Categories: {db_categories}")
        print(f"  Posts: {db_posts}")
        
        # Show posts by category type
        print(f"\nPosts by category type:")
        category_types = session.query(Category.category_type).distinct().all()
        for (cat_type,) in category_types:
            if cat_type:
                post_count = session.query(Post).join(Category).filter(
                    Category.category_type == cat_type
                ).count()
                print(f"  {cat_type}: {post_count} posts")
                
    finally:
        session.close()

if __name__ == "__main__":
    scrape_all_categories()
