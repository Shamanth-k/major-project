@echo off
echo ========================================
echo Aetherium Guard - Backend Setup
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Error installing backend dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created from .env.example
    echo IMPORTANT: Please edit backend/.env with your configuration!
    echo - MongoDB connection string
    echo - JWT secret
    echo - Gemini API key
    pause
) else (
    echo .env file already exists
)

echo.
echo Step 3: Starting MongoDB (if local)...
echo If you're using MongoDB Atlas, skip this step
echo.
choice /C YN /M "Are you using local MongoDB and want to start it now"
if errorlevel 2 goto skip_mongo
if errorlevel 1 (
    net start MongoDB 2>nul
    if errorlevel 1 (
        echo Could not start MongoDB service automatically
        echo Please start MongoDB manually if using local installation
    ) else (
        echo MongoDB started successfully
    )
)
:skip_mongo

echo.
echo Step 4: Seeding admin user...
call npm run seed
if errorlevel 1 (
    echo Warning: Could not seed admin user
    echo Make sure MongoDB is running and connection string is correct
    pause
)

echo.
echo Step 5: Starting backend server...
echo Backend will run on http://localhost:5000
echo.
start cmd /k "npm run dev"

cd ..
echo.
echo ========================================
echo Backend setup complete!
echo ========================================
echo.
echo Default Admin Credentials:
echo Email: admin@aetherium.io
echo Password: Admin@123456
echo.
echo Backend is starting in a new window...
echo Next: Run setup-frontend.bat to setup the frontend
echo.
pause
