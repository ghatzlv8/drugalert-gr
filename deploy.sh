#!/bin/bash

# Deployment script for DrugAlert.gr
# This script helps with common deployment tasks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "api_combined.py" ]; then
    print_error "This script must be run from the DrugAlert project root directory"
    exit 1
fi

case "$1" in
    setup)
        print_status "Setting up DrugAlert environment..."
        
        # Create virtual environment
        if [ ! -d "venv" ]; then
            print_status "Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        # Activate virtual environment
        source venv/bin/activate
        
        # Install Python dependencies
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
        
        # Setup frontend
        print_status "Setting up frontend..."
        cd frontend
        npm install
        cd ..
        
        # Create .env files if they don't exist
        if [ ! -f ".env" ]; then
            print_status "Creating .env file from example..."
            cp .env.example .env
            print_warning "Please edit .env with your configuration values"
        fi
        
        if [ ! -f "frontend/.env.local" ]; then
            print_status "Creating frontend .env.local file from example..."
            cp frontend/.env.local.example frontend/.env.local
            print_warning "Please edit frontend/.env.local with your configuration values"
        fi
        
        print_status "Setup complete!"
        ;;
        
    build)
        print_status "Building frontend for production..."
        cd frontend
        npm run build
        cd ..
        print_status "Build complete!"
        ;;
        
    start-dev)
        print_status "Starting development servers..."
        
        # Start backend in background
        print_status "Starting backend API..."
        source venv/bin/activate
        python3 api_combined.py &
        BACKEND_PID=$!
        
        # Start frontend
        print_status "Starting frontend..."
        cd frontend
        npm run dev &
        FRONTEND_PID=$!
        
        print_status "Development servers started!"
        print_status "Backend PID: $BACKEND_PID"
        print_status "Frontend PID: $FRONTEND_PID"
        print_status "API: http://localhost:8000"
        print_status "Frontend: http://localhost:3000"
        
        # Wait for interrupt
        wait
        ;;
        
    test)
        print_status "Running tests..."
        source venv/bin/activate
        
        # Add your test commands here
        print_warning "No tests configured yet"
        ;;
        
    migrate)
        print_status "Running database migrations..."
        source venv/bin/activate
        
        # Add migration commands here if using Alembic
        print_warning "Manual database setup required"
        ;;
        
    *)
        echo "DrugAlert Deployment Helper"
        echo ""
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  setup      - Initial setup of the project"
        echo "  build      - Build frontend for production"
        echo "  start-dev  - Start development servers"
        echo "  test       - Run tests"
        echo "  migrate    - Run database migrations"
        echo ""
        ;;
esac
