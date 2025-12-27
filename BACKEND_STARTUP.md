# Backend Server Startup Guide

The backend server must be running for the application to work. Here's how to start it:

## Quick Start

Run the startup script:
```bash
./start-backend.sh
```

Or manually:
```bash
cd backend
mvn spring-boot:run
```

## Verify Backend is Running

Check if the backend is responding:
```bash
curl http://localhost:3001/api/health
```

You should see:
```json
{"data":{"status":"ok","message":"Backend API is running"}}
```

## Common Issues

### Port 3001 Already in Use

If you get an error that port 3001 is already in use:

```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Then start the backend again
cd backend && mvn spring-boot:run
```

### Backend Keeps Stopping

If the backend stops unexpectedly:

1. Check the logs: `tail -f /tmp/backend.log`
2. Look for errors in the log file
3. Restart using the startup script

## Keep Backend Running

For development, you can run the backend in a separate terminal window so it stays running.

For production, consider using:
- Systemd service (Linux)
- PM2 (Node.js process manager)
- Docker container
- Cloud deployment (AWS, Heroku, etc.)

## Backend Endpoints

Once running, the backend provides these main endpoints:
- `GET /api/health` - Health check
- `GET /api/dashboard` - Dashboard data
- `GET /api/organizations` - Organization data
- `GET /api/users` - User data
- `GET /api/finance` - Finance data
- `GET /api/attendance/page-data` - Attendance data
- And more...

All endpoints are prefixed with `/api` and run on port 3001.

