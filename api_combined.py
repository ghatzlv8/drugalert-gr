from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Import the original API
from api import app as original_app
# Import auth extension
from api_auth import create_auth_app
# Import beta dashboard
from api_beta_dashboard import create_beta_dashboard_route

# Create a new app that combines both
app = FastAPI(
    title="DrugAlert.gr API",
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

# Mount the original API endpoints (excluding root to avoid conflict)
for route in original_app.routes:
    if hasattr(route, 'path') and route.path not in ['/', '/openapi.json']:
        app.routes.append(route)

# Add authentication endpoints
create_auth_app(app)

# Add beta dashboard route
create_beta_dashboard_route(app)

# Mount static files if directory exists
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api_combined:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
