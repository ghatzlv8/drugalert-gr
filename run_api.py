#!/usr/bin/env python3
import uvicorn
import sys

print("Starting EOF Scraper API...")
print("Beta Dashboard will be available at: http://localhost:8000/beta-dashboard")
print("Homepage will be available at: http://localhost:8000/")
print("\nPress Ctrl+C to stop the server\n")

try:
    from api_combined import app
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
except KeyboardInterrupt:
    print("\nServer stopped.")
except Exception as e:
    print(f"Error starting server: {e}")
    import traceback
    traceback.print_exc()
