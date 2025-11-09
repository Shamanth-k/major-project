@echo off
echo ========================================
echo Aetherium Guard - Frontend Setup
echo ========================================
echo.

echo Step 1: Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo Error installing frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Step 2: Creating .env file...
if not exist .env (
    copy .env.example .env
    echo .env file created from .env.example
    echo Default backend URL: http://localhost:5000/api
) else (
    echo .env file already exists
)

echo.
echo Step 3: Starting frontend server...
echo Frontend will run on http://localhost:5173
echo.
echo Make sure the backend is running on http://localhost:5000
echo.
start cmd /k "npm run dev"

echo.
echo ========================================
echo Frontend setup complete!
echo ========================================
echo.
echo Open your browser to: http://localhost:5173
echo.
echo Login with:
echo Email: admin@aetherium.io
echo Password: Admin@123456
echo.
pause
