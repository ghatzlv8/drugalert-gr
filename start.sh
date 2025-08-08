#!/bin/bash

# EOF Scraper Startup Script

echo "EOF Scraper Management Script"
echo "============================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create logs directory if it doesn't exist
mkdir -p logs

echo ""
echo "What would you like to do?"
echo "1. Run the scraper scheduler (runs every 15 minutes)"
echo "2. Start the API server"
echo "3. Run tests"
echo "4. Run both scraper and API (in separate terminals)"
echo "5. Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Starting scraper scheduler..."
        python scheduler.py
        ;;
    2)
        echo "Starting API server..."
        python api.py
        ;;
    3)
        echo "Running tests..."
        python test_scraper.py
        ;;
    4)
        echo "Starting scraper in background..."
        python scheduler.py > logs/scheduler_output.log 2>&1 &
        SCRAPER_PID=$!
        echo "Scraper started with PID: $SCRAPER_PID"
        
        echo "Starting API server..."
        python api.py
        
        # Kill scraper when API is stopped
        kill $SCRAPER_PID
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac
