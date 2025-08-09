#!/usr/bin/env python3
"""
Script to run the EOF scraper.
This script is designed to be called by cron or manually.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.eof_scraper import EOFScraper
from database.models import DatabaseManager
import logging
from datetime import datetime

def setup_logging():
    """Setup logging configuration"""
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Create a log file with timestamp
    log_file = os.path.join(log_dir, f'scraper_{datetime.now().strftime("%Y%m%d")}.log')
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file, mode='a'),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

def main():
    """Main function"""
    logger = setup_logging()
    
    logger.info("="*50)
    logger.info("Starting EOF scraper run")
    logger.info("="*50)
    
    try:
        # Initialize database
        db_manager = DatabaseManager()
        
        # Initialize scraper
        scraper = EOFScraper(db_manager, logger)
        
        # Run full scrape
        scraper.run_full_scrape()
        
        logger.info("Scraper run completed successfully!")
        
    except Exception as e:
        logger.error(f"Error during scraping: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    main()
