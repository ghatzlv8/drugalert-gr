#!/usr/bin/env python3
"""
Script to setup only the cron job for automated scraping.
"""

import os
import subprocess

def create_cron_script():
    """Create a script that can be called by cron"""
    script_content = """#!/bin/bash
# Cron script for EOF scraper

# Load environment variables if needed
source /opt/drugalert.gr/.env 2>/dev/null || true

# Change to project directory
cd /opt/drugalert.gr

# Run the scraper
/usr/bin/python3 scripts/run_scraper.py >> logs/cron_scraper.log 2>&1
"""
    
    script_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'scripts', 'cron_scraper.sh')
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    # Make script executable
    os.chmod(script_path, 0o755)
    print(f"Created cron script at: {script_path}")
    return script_path

def setup_cron_job():
    """Setup cron job to run every 6 hours"""
    # Create the cron script first
    script_path = create_cron_script()
    
    # Add cron job
    cron_line = f"0 */6 * * * {script_path}"
    
    try:
        # Get current crontab
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True)
        current_cron = result.stdout if result.returncode == 0 else ""
        
        # Check if job already exists
        if script_path in current_cron:
            print("Cron job already exists")
            return
        
        # Add new cron job
        new_cron = current_cron.rstrip() + f"\n{cron_line}\n"
        process = subprocess.Popen(['crontab', '-'], stdin=subprocess.PIPE, text=True)
        process.communicate(input=new_cron)
        
        print(f"Added cron job: {cron_line}")
        print("The scraper will run automatically every 6 hours (at 0:00, 6:00, 12:00, 18:00)")
        
    except Exception as e:
        print(f"Error setting up cron job: {e}")
        print(f"Please add this line manually to crontab: {cron_line}")

if __name__ == "__main__":
    print("Setting up automated scraping cron job...")
    setup_cron_job()
    print("\nDone! You can manually run the scraper anytime with:")
    print("cd /opt/drugalert.gr && python3 scripts/run_scraper.py")
