# EOF Scraper - Quick Start Guide

## What is this?
A web scraper that automatically collects pharmaceutical data from the Greek National Organization for Medicines (EOF) website every 15 minutes and stores it in a database. It includes an API for accessing the data for web/mobile applications.

## Quick Setup (macOS/Linux)

### 1. Navigate to project directory
```bash
cd ~/eof-scraper
```

### 2. Run the startup script
```bash
./start.sh
```

Choose option 3 to run tests first, then option 1 to start the scraper.

## Quick Setup (Manual)

### 1. Create virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run tests
```bash
python test_scraper.py
```

### 4. Start the scraper
```bash
python scheduler.py
```

### 5. Start the API (in another terminal)
```bash
python api.py
```

## Using Docker

### 1. Start all services
```bash
docker-compose up -d
```

### 2. View logs
```bash
docker-compose logs -f scraper
docker-compose logs -f api
```

### 3. Stop services
```bash
docker-compose down
```

## Accessing the Data

### Via API
- Base URL: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Example endpoints:
  - GET /categories - List all categories
  - GET /posts?limit=10 - Get latest 10 posts
  - GET /stats - Get database statistics

### Via Database
- SQLite: Database file is at `database/eof_scraper.db`
- PostgreSQL: Connect with credentials from docker-compose.yml

## Important Information

1. **First Run**: The scraper will start immediately and then run every 15 minutes
2. **Logs**: Check `logs/eof_scraper.log` for detailed information
3. **Database**: By default uses SQLite, can be changed to PostgreSQL/MySQL
4. **Rate Limiting**: The scraper has a 1-second delay between requests to be respectful

## Troubleshooting

### Scraper not finding posts
- The website structure might have changed
- Check logs for specific errors

### API not starting
- Port 8000 might be in use
- Check `lsof -i :8000` and kill the process if needed

### Out of memory
- Reduce MAX_PAGES_PER_CATEGORY in config/config.py

## Next Steps

1. Set up a production database (PostgreSQL recommended)
2. Configure monitoring and alerts
3. Deploy to a server with a process manager
4. Set up automatic backups

For more details, see README.md
