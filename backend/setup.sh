#!/bin/bash
# Quick Setup Script for Deadline Detection System Backend
# Run this script to set up the project automatically

set -e  # Exit on error

echo "🚀 Setting up Deadline Detection System Backend..."
echo ""

# Check Python version
echo "📋 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version detected"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi
echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"
echo ""

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip --quiet
echo "✓ pip upgraded"
echo ""

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt --quiet
echo "✓ Dependencies installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and update:"
    echo "   - DATABASE_URL (PostgreSQL password)"
    echo "   - SECRET_KEY (generate a secure key)"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL client found"
    echo ""
    echo "📊 To create the database, run:"
    echo "   psql -U postgres -c 'CREATE DATABASE deadline_db;'"
    echo ""
else
    echo "⚠️  PostgreSQL client not found in PATH"
    echo "   Make sure PostgreSQL is installed and running"
    echo ""
fi

# Run migrations
echo "🗄️  Running database migrations..."
read -p "Have you created the 'deadline_db' database? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    alembic upgrade head
    echo "✓ Migrations completed"
    echo ""
else
    echo "⏭️  Skipping migrations. Run 'alembic upgrade head' after creating the database."
    echo ""
fi

# Success message
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env file with your database credentials"
echo "   2. Create PostgreSQL database: CREATE DATABASE deadline_db;"
echo "   3. Run migrations: alembic upgrade head"
echo "   4. Start server: uvicorn app.main:app --reload"
echo ""
echo "📚 Documentation: http://localhost:8000/docs"
echo "🏥 Health check: http://localhost:8000/health"
echo ""
echo "Happy coding! 🚀"
