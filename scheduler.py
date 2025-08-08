#!/usr/bin/env python3
import schedule
import time
import logging
from datetime import datetime
import sys
import os
import signal
from logging.handlers import RotatingFileHandler

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.models import DatabaseManager
from scraper.eof_scraper import EOFScraper

# Global flag for graceful shutdown
shutdown_flag = False

def signal_handler(signum, frame):
    global shutdown_flag
    logging.info("Received shutdown signal. Finishing current job...")
    shutdown_flag = True

def setup_logging():
    """Setup logging configuration"""
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, 'eof_scraper.log')
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Setup file handler with rotation
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(formatter)
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    return root_logger

def run_scraper():
    """Run the scraper"""
    if shutdown_flag:
        return
    
    logger = logging.getLogger(__name__)
    logger.info("Starting scheduled scrape...")
    
    try:
        # Initialize database
        db_manager = DatabaseManager()
        
        # Initialize scraper
        scraper = EOFScraper(db_manager, logger)
        
        # Run the scrape
        scraper.run_full_scrape()
        
        logger.info("Scheduled scrape completed successfully")
        
    except Exception as e:
        logger.error(f"Error during scheduled scrape: {str(e)}", exc_info=True)

def main():
    """Main scheduler function"""
    # Setup logging
    logger = setup_logging()
    logger.info("EOF Scraper Scheduler Starting...")
    
    # Setup signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run immediately on startup
    logger.info("Running initial scrape on startup...")
    run_scraper()
    
    # Schedule to run every 15 minutes
    schedule.every(15).minutes.do(run_scraper)
    
    logger.info("Scheduler configured to run every 15 minutes")
    
    # Keep the script running
    while not shutdown_flag:
        try:
            schedule.run_pending()
            time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Keyboard interrupt received")
            break
    
    logger.info("Scheduler shutting down...")

if __name__ == "__main__":
    main()
