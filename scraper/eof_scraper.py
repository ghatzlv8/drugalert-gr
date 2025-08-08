import requests
from bs4 import BeautifulSoup
from datetime import datetime
import time
import logging
import re
from urllib.parse import urljoin, urlparse
from tenacity import retry, stop_after_attempt, wait_exponential
import json

class EOFScraper:
    def __init__(self, db_manager, logger=None):
        self.base_url = "https://www.eof.gr"
        self.db_manager = db_manager
        self.logger = logger or logging.getLogger(__name__)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Categories to scrape
        self.categories = {
            'farmaka': {
                'name': 'Φάρμακα',
                'url': '/category/farmaka/',
                'subcategories': {
                    'adeia-dynatotitas-paragogis-diakinisis-farmaka': 'Άδεια δυνατότητας παραγωγής/διακίνησης',
                    'anakliseis-farmakon-anthropinis-xrisis-farmaka': 'Ανακλήσεις φαρμάκων ανθρώπινης χρήσης',
                    'anakoinoseis-timologisis-farmakon-farnaka': 'Ανακοινώσεις τιμολόγησης φαρμάκων',
                    'anakoinoseis-farmaka': 'Ανακοινώσεις φαρμάκων',
                    'egkyklioi-drastikon-ousion-farmaka': 'Εγκύκλιοι δραστικών ουσιών',
                    'klinikes-meletes': 'Κλινικές μελέτες',
                    'parigoritiki-xrisi-farmaka': 'Παρηγορητική χρήση',
                    'farmakoepagripnisi-farmaka': 'Φαρμακοεπαγρύπνηση'
                }
            }
        }
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_page(self, url):
        """Fetch a page with retry logic"""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            self.logger.error(f"Error fetching {url}: {str(e)}")
            raise
    
    def parse_post_list(self, html, category_url):
        """Parse a list of posts from a category page"""
        soup = BeautifulSoup(html, 'lxml')
        posts = []
        
        # Find all post entries
        articles = soup.find_all('article') or soup.find_all('div', class_='post')
        
        for article in articles:
            try:
                # Find the title and URL
                title_elem = article.find('h3', class_='entry-title') or article.find('h2', class_='entry-title')
                if not title_elem:
                    continue
                
                link_elem = title_elem.find('a')
                if not link_elem:
                    continue
                
                post_url = link_elem.get('href', '')
                if not post_url:
                    continue
                
                # Make URL absolute
                if not post_url.startswith('http'):
                    post_url = urljoin(self.base_url, post_url)
                
                post_title = link_elem.text.strip()
                
                # Try to find excerpt
                excerpt = ''
                excerpt_elem = article.find('div', class_='entry-summary') or article.find('div', class_='excerpt')
                if excerpt_elem:
                    excerpt = excerpt_elem.text.strip()
                
                # Try to find date
                date_elem = article.find('time') or article.find('span', class_='date')
                publish_date = None
                if date_elem:
                    date_str = date_elem.get('datetime') or date_elem.text
                    publish_date = self.parse_date(date_str)
                
                posts.append({
                    'url': post_url,
                    'title': post_title,
                    'excerpt': excerpt,
                    'publish_date': publish_date
                })
                
            except Exception as e:
                self.logger.error(f"Error parsing post in list: {str(e)}")
                continue
        
        return posts
    
    def parse_post_content(self, html, post_url):
        """Parse the full content of a post"""
        soup = BeautifulSoup(html, 'lxml')
        
        # Find main content
        content_elem = soup.find('div', class_='entry-content') or \
                      soup.find('div', class_='post-content') or \
                      soup.find('article')
        
        content = ''
        if content_elem:
            # Remove script and style elements
            for script in content_elem(['script', 'style']):
                script.decompose()
            content = content_elem.get_text(separator='\n', strip=True)
        
        # Find attachments (PDFs, etc.)
        attachments = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if any(href.lower().endswith(ext) for ext in ['.pdf', '.doc', '.docx', '.xls', '.xlsx']):
                file_url = urljoin(self.base_url, href)
                file_name = link.text.strip() or href.split('/')[-1]
                file_type = href.split('.')[-1].lower()
                attachments.append({
                    'file_url': file_url,
                    'file_name': file_name,
                    'file_type': file_type
                })
        
        # Find meta description
        meta_desc = ''
        meta_elem = soup.find('meta', attrs={'name': 'description'})
        if meta_elem:
            meta_desc = meta_elem.get('content', '')
        
        # Find tags
        tags = []
        tag_container = soup.find('div', class_='tags') or soup.find('div', class_='post-tags')
        if tag_container:
            for tag in tag_container.find_all('a'):
                tags.append(tag.text.strip())
        
        return {
            'content': content,
            'attachments': attachments,
            'meta_description': meta_desc,
            'tags': ','.join(tags)
        }
    
    def parse_date(self, date_str):
        """Parse various date formats"""
        if not date_str:
            return None
        
        # Try ISO format first
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            pass
        
        # Try other common formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%d-%m-%Y',
            '%Y/%m/%d',
            '%d %B %Y',
            '%B %d, %Y'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except:
                continue
        
        return None
    
    def get_pagination_urls(self, html, base_url):
        """Extract pagination URLs from a category page"""
        soup = BeautifulSoup(html, 'lxml')
        urls = []
        
        # Find pagination container
        pagination = soup.find('div', class_='basel-pagination') or \
                    soup.find('div', class_='pagination') or \
                    soup.find('nav', class_='pagination')
        
        if pagination:
            # Find all page links
            for link in pagination.find_all('a', href=True):
                href = link['href']
                if 'page' in href:
                    full_url = urljoin(self.base_url, href)
                    if full_url not in urls:
                        urls.append(full_url)
        
        return sorted(urls)
    
    def scrape_category(self, category_slug, category_name, category_url, parent_category=None):
        """Scrape all posts from a category"""
        from database.models import Category, Post, Attachment
        session = self.db_manager.get_session()
        
        try:
            # Get or create category
            full_url = urljoin(self.base_url, category_url)
            category = session.query(Category).filter_by(slug=category_slug).first()
            
            if not category:
                category = Category(
                    name=category_name,
                    slug=category_slug,
                    url=full_url,
                    parent_id=parent_category.id if parent_category else None
                )
                session.add(category)
                session.commit()
            
            posts_scraped = 0
            posts_new = 0
            posts_updated = 0
            
            # Scrape first page
            self.logger.info(f"Scraping category: {category_name} - {full_url}")
            html = self.fetch_page(full_url)
            posts = self.parse_post_list(html, full_url)
            
            # Get pagination URLs
            pagination_urls = self.get_pagination_urls(html, full_url)
            self.logger.info(f"Found {len(pagination_urls)} additional pages for {category_name}")
            
            # Process posts from first page
            for post_data in posts:
                result = self.scrape_post(post_data, category, session)
                posts_scraped += 1
                if result == 'new':
                    posts_new += 1
                elif result == 'updated':
                    posts_updated += 1
            
            # Scrape additional pages
            for page_url in pagination_urls[:10]:  # Limit to first 10 pages for now
                try:
                    self.logger.info(f"Scraping page: {page_url}")
                    html = self.fetch_page(page_url)
                    posts = self.parse_post_list(html, page_url)
                    
                    for post_data in posts:
                        result = self.scrape_post(post_data, category, session)
                        posts_scraped += 1
                        if result == 'new':
                            posts_new += 1
                        elif result == 'updated':
                            posts_updated += 1
                    
                    # Be nice to the server
                    time.sleep(1)
                    
                except Exception as e:
                    self.logger.error(f"Error scraping page {page_url}: {str(e)}")
                    continue
            
            session.commit()
            self.logger.info(f"Category {category_name} complete: {posts_scraped} scraped, {posts_new} new, {posts_updated} updated")
            
            return posts_scraped, posts_new, posts_updated
            
        except Exception as e:
            session.rollback()
            self.logger.error(f"Error scraping category {category_name}: {str(e)}")
            raise
        finally:
            session.close()
    
    def scrape_post(self, post_data, category, session):
        """Scrape a single post"""
        from database.models import Post, Attachment
        try:
            # Check if post already exists
            existing_post = session.query(Post).filter_by(url=post_data['url']).first()
            
            # Fetch full post content
            html = self.fetch_page(post_data['url'])
            content_data = self.parse_post_content(html, post_data['url'])
            
            if existing_post:
                # Update existing post
                existing_post.title = post_data['title']
                existing_post.content = content_data['content']
                existing_post.excerpt = post_data.get('excerpt', '')
                existing_post.meta_description = content_data['meta_description']
                existing_post.tags = content_data['tags']
                existing_post.last_modified = datetime.utcnow()
                
                # Update attachments
                for attachment in existing_post.attachments:
                    session.delete(attachment)
                
                for att_data in content_data['attachments']:
                    attachment = Attachment(
                        post_id=existing_post.id,
                        file_url=att_data['file_url'],
                        file_name=att_data['file_name'],
                        file_type=att_data['file_type']
                    )
                    session.add(attachment)
                
                return 'updated'
            else:
                # Create new post
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
                session.flush()  # Get the ID
                
                # Add attachments
                for att_data in content_data['attachments']:
                    attachment = Attachment(
                        post_id=new_post.id,
                        file_url=att_data['file_url'],
                        file_name=att_data['file_name'],
                        file_type=att_data['file_type']
                    )
                    session.add(attachment)
                
                return 'new'
                
        except Exception as e:
            self.logger.error(f"Error scraping post {post_data.get('url', 'unknown')}: {str(e)}")
            return 'error'
    
    def run_full_scrape(self):
        """Run a full scrape of all categories"""
        from database.models import Category, ScrapeLog
        start_time = datetime.utcnow()
        session = self.db_manager.get_session()
        
        # Create scrape log
        scrape_log = ScrapeLog(start_time=start_time, status='running')
        session.add(scrape_log)
        session.commit()
        
        total_scraped = 0
        total_new = 0
        total_updated = 0
        errors = []
        
        try:
            # Scrape main categories
            for cat_slug, cat_info in self.categories.items():
                try:
                    scraped, new, updated = self.scrape_category(
                        cat_slug, 
                        cat_info['name'], 
                        cat_info['url']
                    )
                    total_scraped += scraped
                    total_new += new
                    total_updated += updated
                    
                    # Scrape subcategories
                    parent_cat = session.query(Category).filter_by(slug=cat_slug).first()
                    for subcat_slug, subcat_name in cat_info.get('subcategories', {}).items():
                        subcat_url = f"/category/farmaka/{subcat_slug}/"
                        try:
                            scraped, new, updated = self.scrape_category(
                                subcat_slug,
                                subcat_name,
                                subcat_url,
                                parent_cat
                            )
                            total_scraped += scraped
                            total_new += new
                            total_updated += updated
                        except Exception as e:
                            error_msg = f"Error in subcategory {subcat_slug}: {str(e)}"
                            self.logger.error(error_msg)
                            errors.append(error_msg)
                    
                except Exception as e:
                    error_msg = f"Error in category {cat_slug}: {str(e)}"
                    self.logger.error(error_msg)
                    errors.append(error_msg)
            
            # Update scrape log
            end_time = datetime.utcnow()
            scrape_log.end_time = end_time
            scrape_log.status = 'success' if not errors else 'partial'
            scrape_log.posts_scraped = total_scraped
            scrape_log.posts_new = total_new
            scrape_log.posts_updated = total_updated
            scrape_log.errors = '\n'.join(errors) if errors else None
            scrape_log.duration_seconds = int((end_time - start_time).total_seconds())
            
            session.commit()
            
            self.logger.info(f"Scrape complete: {total_scraped} posts, {total_new} new, {total_updated} updated")
            
        except Exception as e:
            scrape_log.status = 'failed'
            scrape_log.errors = str(e)
            session.commit()
            self.logger.error(f"Scrape failed: {str(e)}")
            raise
        finally:
            session.close()

