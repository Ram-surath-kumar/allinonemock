# Backend Server Status

## ✅ Backend is Running

The Java Spring Boot backend is now running and accessible at:
- **URL**: `http://localhost:3001/api`
- **Status**: ✅ Running (Process ID: Check with `lsof -ti:3001`)

## Frontend Configuration

The frontend is correctly configured to use the Java backend:

**File**: `src/services/api.ts`
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

This means:
- If `VITE_API_URL` environment variable is set, it will use that
- Otherwise, it defaults to `http://localhost:3001/api` (the Java backend)

## Verification

To verify the backend is running:
```bash
# Check if port 3001 is in use
lsof -ti:3001

# Test health endpoint
curl http://localhost:3001/api/health

# Test users endpoint
curl "http://localhost:3001/api/users?email=admin@school.edu"
```

## Starting the Backend

If the backend is not running, start it with:
```bash
cd backend
mvn spring-boot:run
```

The backend will start on `http://localhost:3001/api`

## All Endpoints Available

See `backend/API_ENDPOINTS.md` for complete list of all available endpoints.

## Troubleshooting

If you see `ERR_CONNECTION_REFUSED`:
1. Check if backend is running: `lsof -ti:3001`
2. Check backend logs: `tail -f /tmp/backend.log`
3. Restart backend: `cd backend && mvn spring-boot:run`

