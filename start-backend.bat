@echo off
echo ========================================
echo Study Guardian - Quick Start Script
echo ========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/5] ✓ Docker is running
    
    REM Check if MongoDB container exists
    docker ps -a | findstr "study-guardian-mongodb" >nul
    if %errorlevel% equ 0 (
        echo [2/5] ✓ MongoDB container exists
        docker start study-guardian-mongodb >nul 2>&1
        echo [3/5] ✓ MongoDB container started
    ) else (
        echo [2/5] Starting MongoDB container...
        docker-compose up -d
        echo [3/5] ✓ MongoDB container created and started
    )
    
    echo [4/5] Waiting for MongoDB to be ready...
    timeout /t 3 >nul
    
    echo [5/5] Starting backend server...
    echo.
    echo ========================================
    echo MongoDB: Running on port 27017
    echo Backend will start on: http://localhost:5002
    echo Health check: http://localhost:5002/health
    echo ========================================
    echo.
    cd backend
    npm start
) else (
    echo [X] Docker is not running!
    echo.
    echo Please choose an option:
    echo.
    echo Option 1: Start Docker Desktop
    echo   - Open Docker Desktop from Start Menu
    echo   - Wait for it to fully start (green icon)
    echo   - Run this script again
    echo.
    echo Option 2: Use MongoDB Atlas (cloud)
    echo   - See MONGODB_SETUP.md for instructions
    echo.
    echo Option 3: Install MongoDB locally
    echo   - Download from: https://www.mongodb.com/try/download/community
    echo   - Update backend\.env file
    echo.
    pause
)
