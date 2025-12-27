#!/bin/bash

# Start the Java Spring Boot backend server
# This script ensures the backend is running on port 3001

cd "$(dirname "$0")/backend"

# Kill any existing process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

# Start the backend
echo "Starting backend server on port 3001..."
mvn spring-boot:run > /tmp/backend.log 2>&1 &

# Wait a bit for it to start
sleep 5

# Check if it started successfully
if curl -s "http://localhost:3001/api/health" > /dev/null 2>&1; then
    echo "✅ Backend server started successfully!"
    echo "📝 Logs are available at: /tmp/backend.log"
    echo "🌐 API is available at: http://localhost:3001/api"
else
    echo "❌ Backend server failed to start. Check /tmp/backend.log for errors."
    exit 1
fi

