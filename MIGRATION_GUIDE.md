# Migration Guide: Node.js to Java Backend

## Overview
This project has been migrated from a Node.js/Express backend to a Java Spring Boot backend. The new backend provides consolidated API endpoints that combine multiple data sources into single responses, reducing frontend API calls.

## Key Changes

### 1. Backend Technology
- **Old**: Node.js with Express
- **New**: Java 17 with Spring Boot 3.2.0

### 2. API Architecture
- **Old**: Multiple separate API calls from frontend (users, departments, attendance, etc.)
- **New**: Consolidated endpoints that return all required data in a single response

### 3. Validation
- **Old**: Validation in frontend and some in backend
- **New**: All validation moved to Java backend

## New Consolidated Endpoints

### Dashboard Data
**Old approach** (multiple calls):
```typescript
const students = await api.getUsers({ role: 'student' });
const departments = await api.getDepartments();
const activities = await api.getActivities(10);
const notifications = await api.getNotifications({ user_id: userId });
```

**New approach** (single call):
```typescript
const dashboardData = await api.getDashboardData(userId, role);
// Returns: { stats, recentActivities, students, departments, notifications, userInfo }
```

### Attendance Page Data
**Old approach** (multiple calls):
```typescript
const students = await api.getUsersByDepartments(deptIds, 'student', 'active');
const departments = await fetchDepartments();
const attendance = await api.getAttendance({ date, student_ids });
const teacherDepts = await fetchTeacherDepartments(teacherId);
```

**New approach** (single call):
```typescript
const attendanceData = await api.getAttendancePageData(userId, role, date);
// Returns: { students, departments, attendanceRecords, teacherDepartmentIds, userInfo }
```

## Setup Instructions

### Backend Setup

1. **Prerequisites**:
   - Java 17 or higher
   - Maven 3.6+

2. **Configure Environment**:
   ```bash
   cd backend
   # Set environment variables or create application-local.yml
   export SUPABASE_URL=https://vzkbyzpqnojhlazwopvz.supabase.co
   export SUPABASE_ANON_KEY=your_anon_key
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Build and Run**:
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

   Server runs on `http://localhost:3001/api`

### Frontend Setup

1. **Update API URL** (if needed):
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```

2. **No other changes needed** - the frontend API client has been updated to use consolidated endpoints automatically.

## API Endpoints

### Consolidated Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Get all dashboard data |
| `/api/attendance/page-data` | GET | Get all attendance page data |
| `/api/attendance/mark` | POST | Mark attendance with validation |

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/users` | POST | Create user (with validation) |
| `/api/users/{id}` | PUT | Update user (with validation) |
| `/api/users/{id}` | DELETE | Delete user |

## Benefits

1. **Reduced API Calls**: Frontend makes fewer requests, improving performance
2. **Backend Validation**: All validation logic centralized in Java
3. **Type Safety**: Strong typing with Java
4. **Better Error Handling**: Comprehensive error handling with meaningful messages
5. **Easier Maintenance**: Business logic centralized in backend services

## Migration Checklist

- [x] Create Spring Boot backend structure
- [x] Implement Supabase service layer
- [x] Create consolidated dashboard endpoint
- [x] Create consolidated attendance endpoint
- [x] Implement backend validation
- [x] Update frontend API client
- [x] Update Attendance component to use consolidated API
- [ ] Update Dashboard component to use consolidated API
- [ ] Update other components as needed
- [ ] Test all endpoints
- [ ] Update documentation

## Notes

- The old Node.js backend (`server/` directory) can be removed after migration is complete
- All validation is now in the Java backend
- The frontend should use consolidated endpoints whenever possible
- Legacy endpoints may still work but are not recommended

