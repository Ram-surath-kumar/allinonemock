@echo off
echo Starting Backend Server...
start "Backend Server" cmd /k "cd server && npm run dev"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo Both servers are starting in separate windows.
