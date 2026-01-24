@echo off
REM Start both frontend and backend servers for schoolsphere-admin
echo ========================================
echo Starting SchoolSphere Admin Servers
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] node_modules not found!
    echo Please run: npm install
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server on http://localhost:3001
echo.
start "SchoolSphere Backend" cmd /k "npm run server"

REM Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Frontend on http://localhost:5173
echo.
start "SchoolSphere Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:3001/api/health
echo Frontend: http://localhost:5173
echo.
echo Two command windows will open - DO NOT CLOSE THEM
echo Press Ctrl+C in each window to stop the servers
echo.
pause
