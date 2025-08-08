# EOF Scraper

A comprehensive web scraper for the Greek National Organization for Medicines (EOF) website that automatically collects and stores pharmaceutical announcements, recalls, and other important information.

## Features

- **Automated Scraping**: Runs every 15 minutes to check for new content
- **Database Storage**: Stores all scraped data in a structured database
- **RESTful API**: Provides endpoints for accessing the scraped data
- **Multi-platform Support**: Can be used for web, Android, and iOS applications
- **Logging**: Comprehensive logging with rotation
- **Error Handling**: Robust error handling with retry mechanisms

## Project Structure

```
eof-scraper/
├── api.py                 # FastAPI application for serving data
├── scheduler.py           # Main scheduler that runs the scraper
├── requirements.txt       # Python dependencies
├── config/
│   └── config.py         # Configuration settings
├── database/
│   └── models.py         # SQLAlchemy database models
├── scraper/
│   └── eof_scraper.py    # Main scraper implementation
└── logs/                 # Log files (created automatically)
```

## Installation

1. Clone the repository:
```bash
cd ~/eof-scraper
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

The scraper can be configured through environment variables or by editing `config/config.py`:

- **DATABASE_TYPE**: Choose between 'sqlite', 'postgresql', or 'mysql'
- **DATABASE_URL**: Database connection string (if not using SQLite)
- **Scraper intervals**: Set in SCHEDULER_CONFIG

## Usage

### Running the Scraper

To start the automated scraper that runs every 15 minutes:

```bash
python scheduler.py
```

The scraper will:
1. Run immediately on startup
2. Continue running every 15 minutes
3. Log all activities to the `logs/` directory

### Running the API

To start the API server:

```bash
python api.py
```

The API will be available at `http://localhost:8000`

### API Endpoints

- `GET /` - API status
- `GET /categories` - List all categories
- `GET /categories/{id}` - Get specific category
- `GET /posts` - List posts with filtering and pagination
- `GET /posts/{id}` - Get specific post
- `GET /posts/recent` - Get most recent posts
- `GET /scrape-logs` - View scraping history
- `GET /stats` - Get database statistics

### API Documentation

When the API is running, visit:
- `http://localhost:8000/docs` - Interactive API documentation (Swagger UI)
- `http://localhost:8000/redoc` - Alternative API documentation (ReDoc)

## Database Schema

### Categories
- id, name, slug, url, parent_id, timestamps

### Posts
- id, title, url, content, excerpt, category_id, publish_date, tags, timestamps

### Attachments
- id, post_id, file_url, file_name, file_type, file_size

### ScrapeLog
- id, start_time, end_time, status, statistics, errors

## Development

### Adding New Categories

Edit `scraper/eof_scraper.py` and add new categories to the `categories` dictionary in the `EOFScraper` class.

### Changing Scrape Interval

Edit `config/config.py` and modify `SCHEDULER_CONFIG['interval_minutes']`.

### Database Migrations

The database schema is automatically created on first run. For schema changes, you'll need to handle migrations manually or drop and recreate the database.

## Monitoring

Check the `logs/eof_scraper.log` file for:
- Scraping progress
- Errors and warnings
- Performance metrics
- New content notifications

## Deployment

For production deployment:

1. Use PostgreSQL or MySQL instead of SQLite
2. Set up a process manager (systemd, supervisor, etc.)
3. Configure proper database backups
4. Set up monitoring and alerts
5. Use a reverse proxy (nginx) for the API

## Troubleshooting

1. **Scraper not finding posts**: Check if the website structure has changed
2. **Database errors**: Ensure proper permissions and connection settings
3. **API not starting**: Check if port 8000 is already in use
4. **Memory issues**: Reduce `max_pages_per_category` in config

## License

This project is for educational and monitoring purposes. Respect the website's robots.txt and terms of service.
