import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_CONFIG = {
    'sqlite': {
        'url': 'sqlite:///database/eof_scraper.db'
    },
    'postgresql': {
        'url': os.getenv('DATABASE_URL', 'postgresql://user:password@localhost/eof_scraper')
    },
    'mysql': {
        'url': os.getenv('DATABASE_URL', 'mysql+pymysql://user:password@localhost/eof_scraper')
    }
}

# Select database type
DATABASE_TYPE = os.getenv('DATABASE_TYPE', 'sqlite')
DATABASE_URL = DATABASE_CONFIG[DATABASE_TYPE]['url']

# Scraper configuration
SCRAPER_CONFIG = {
    'base_url': 'https://www.eof.gr',
    'max_pages_per_category': 10,  # Limit pages to scrape per category
    'request_timeout': 30,
    'retry_attempts': 3,
    'delay_between_requests': 1,  # seconds
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Scheduler configuration
SCHEDULER_CONFIG = {
    'interval_minutes': 15,
    'run_on_startup': True,
    'max_log_size_mb': 10,
    'log_backup_count': 5
}

# API configuration (for future use)
API_CONFIG = {
    'host': '0.0.0.0',
    'port': 8000,
    'debug': False,
    'cors_origins': ['*']
}
