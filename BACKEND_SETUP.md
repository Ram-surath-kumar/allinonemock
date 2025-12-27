# Backend Setup Instructions

## Overview
This project now uses a backend API server that acts as a proxy to Supabase. All database operations go through the backend REST API instead of direct Supabase calls.

## Setup Steps

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=3001
SUPABASE_URL=https://vzkbyzpqnojhlazwopvz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required for write operations (create, update, delete) to bypass Row Level Security (RLS) policies. You can find this key in your Supabase project settings under "API" → "Service Role Key". **Never expose this key in client-side code.**

### 3. Start Backend Server
```bash
cd server
npm run dev
```

The backend will run on `http://localhost:3001`

### 4. Configure Frontend
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3001/api
```

### 5. Start Frontend
```bash
npm run dev
```

## API Endpoints

### Users
- `GET /api/users` - Get all users (with optional filters)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/by-departments` - Get users by department IDs
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Organizations
- `GET /api/organizations` - Get organizations

### Departments
- `GET /api/departments` - Get departments
- `POST /api/departments` - Create department

### Teacher Departments
- `GET /api/teacher-departments/:teacherId` - Get teacher departments
- `POST /api/teacher-departments` - Update teacher departments

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Activities
- `GET /api/activities` - Get activities
- `POST /api/activities` - Create activity

## Development

### Running Both Servers
You can run both servers simultaneously:
1. Terminal 1: `cd server && npm run dev` (Backend on port 3001)
2. Terminal 2: `npm run dev` (Frontend on port 8080)

### Testing
- Backend health check: `http://localhost:3001/api/health`
- Frontend: `http://localhost:8080`

## Migration Notes

All frontend components have been updated to use the `api` service from `@/services/api` instead of direct Supabase calls. The API client handles all HTTP requests and error handling.

