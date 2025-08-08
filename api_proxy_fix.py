from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
import os

# Import the original API
from api import app as original_app
# Import auth extension
from api_auth import create_auth_app

# Create a new app that combines both
app = FastAPI(
    title="EOF Alert API",
    description="API for EOF drug alerts with authentication",
    version="2.0.0",
    servers=[{"url": "/api", "description": "Production server"}],
    docs_url=None,  # Disable automatic docs
    redoc_url=None,  # Disable automatic redoc
    openapi_url="/openapi.json"
)

# Custom docs endpoint that uses the correct OpenAPI URL
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    return get_swagger_ui_html(
        openapi_url="/api/openapi.json",
        title=app.title + " - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
    )

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the original app's routes
for route in original_app.routes:
    if hasattr(route, 'path') and route.path not in ['/', '/openapi.json', '/docs', '/redoc']:
        app.routes.append(route)

# Add authentication endpoints
create_auth_app(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
