@echo off
REM Quick Setup Script for Deadline Detection System Backend (Windows)
REM Run this script to set up the project automatically

echo.
echo ========================================
echo   Deadline Detection System - Setup
echo ========================================
echo.

REM Check Python version
echo [1/8] Checking Python version...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.11+
    pause
    exit /b 1
)
echo.

REM Create virtual environment
echo [2/8] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)
echo.

REM Activate virtual environment
echo [3/8] Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Upgrade pip
echo [4/8] Upgrading pip...
python -m pip install --upgrade pip --quiet
echo pip upgraded
echo.

REM Install dependencies
echo [5/8] Installing dependencies (this may take 2-3 minutes)...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo Dependencies installed successfully
echo.

REM Create .env file
echo [6/8] Setting up environment file...
if not exist ".env" (
    copy .env.example .env
    echo .env file created from template
    echo.
    echo IMPORTANT: Edit .env file and update:
    echo   - DATABASE_URL (PostgreSQL password)
    echo   - SECRET_KEY (generate a secure key)
    echo.
) else (
    echo .env file already exists
)
echo.

REM Database setup instructions
echo [7/8] Database setup...
echo.
echo To create the PostgreSQL database, open pgAdmin or psql and run:
echo   CREATE DATABASE deadline_db;
echo.
set /p db_created="Have you created the 'deadline_db' database? (y/n): "
if /i "%db_created%"=="y" (
    echo Running database migrations...
    alembic upgrade head
    if %errorlevel% neq 0 (
        echo ERROR: Migration failed. Check your DATABASE_URL in .env
        pause
        exit /b 1
    )
    echo Migrations completed successfully
) else (
    echo Skipping migrations. Run 'alembic upgrade head' after creating the database.
)
echo.

REM Success message
echo [8/8] Setup complete!
echo.
echo ========================================
echo   Setup Completed Successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env file with your database credentials
echo   2. Create PostgreSQL database: CREATE DATABASE deadline_db;
echo   3. Run migrations: alembic upgrade head
echo   4. Start server: uvicorn app.main:app --reload
echo.
echo Documentation: http://localhost:8000/docs
echo Health check:  http://localhost:8000/health
echo.
echo Happy coding!
echo.
pause
