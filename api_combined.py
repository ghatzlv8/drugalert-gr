from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import the original API
from api import app as original_app
# Import auth extension
from api_auth import create_auth_app

# Create a new app that combines both
app = FastAPI(
    title="EOF Alert API",
    description="API for EOF drug alerts with authentication",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the original API endpoints
for route in original_app.routes:
    if hasattr(route, 'path') and route.path != '/':
        app.routes.append(route)

# Add authentication endpoints
create_auth_app(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_combined:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
