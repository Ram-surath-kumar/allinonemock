# Java Spring Boot Backend - Complete API Endpoints

This document lists all available API endpoints in the Java Spring Boot backend.

## Base URL
All endpoints are prefixed with `/api`

## Health Check
- **GET** `/api/health` - Health check endpoint

## Consolidated Endpoints (Recommended)

### Dashboard
- **GET** `/api/dashboard?userId={userId}&role={role}` - Get all dashboard data in a single call
  - Returns: stats, recentActivities, students, departments, notifications, userInfo, organizationInfo, allUsers

### Attendance
- **GET** `/api/attendance/page-data?userId={userId}&role={role}&date={date}` - Get all attendance page data
  - Returns: students, departments, attendanceRecords, teacherDepartmentIds, userInfo
- **POST** `/api/attendance/mark` - Mark attendance with validation
  - Body: `{ "records": [{ "student_id": "uuid", "date": "2024-01-01", "status": "present" }] }`

## User Management

- **GET** `/api/users?email={email}&role={role}&status={status}&department_id={id}&org_id={id}&user_id={id}` - Get users with filters
- **GET** `/api/users/{id}` - Get user by ID
- **POST** `/api/users` - Create user (with validation)
- **PUT** `/api/users/{id}` - Update user (with validation)
- **DELETE** `/api/users/{id}` - Delete user
- **POST** `/api/users/by-departments` - Get users by department IDs
  - Body: `{ "department_ids": ["id1", "id2"], "role": "student", "status": "active" }`

## Organizations

- **GET** `/api/organizations?id={id}&org_name={name}` - Get organizations with filters
- **GET** `/api/organizations/{id}` - Get organization by ID
- **PUT** `/api/organizations/{id}` - Update organization
  - Body: `{ "org_name": "name", "org_code": "code", ... }`

## Departments

- **GET** `/api/departments?id={id}&ids={id1,id2,...}` - Get departments with filters
- **POST** `/api/departments` - Create department
  - Body: `{ "name": "Department Name", "created_by": "user_id" }`

## Teacher Departments

- **GET** `/api/teacher-departments/{teacherId}` - Get teacher's departments
- **POST** `/api/teacher-departments` - Update teacher departments
  - Body: `{ "teacher_id": "uuid", "department_ids": ["id1", "id2"] }`

## Notifications

- **GET** `/api/notifications?user_id={id}&read={true|false}&limit={number}` - Get notifications with filters
- **POST** `/api/notifications` - Create notification
  - Body: `{ "user_id": "uuid", "message": "Notification message", "type": "info" }`
- **PUT** `/api/notifications/{id}/read` - Mark notification as read
- **PUT** `/api/notifications/read-all` - Mark all notifications as read for user
  - Body: `{ "user_id": "uuid" }`

## Activities

- **GET** `/api/activities?limit={number}` - Get activities (sorted by created_at desc)
- **POST** `/api/activities` - Create single activity
  - Body: `{ "type": "user_created", "description": "User was created", "user_id": "uuid" }`
- **POST** `/api/activities/batch` - Create multiple activities
  - Body: `[{ "type": "user_created", "description": "..." }, ...]`

## Response Format

All endpoints return responses in the following format:

```json
{
  "data": <response_data>,
  "error": null
}
```

On error:
```json
{
  "data": null,
  "error": "Error message"
}
```

## Validation

All write operations (POST, PUT) include backend validation:
- Required fields are validated
- Email format validation
- Role validation (admin, vice_head, teacher, student, housekeeping, librarian, accountant)
- Status validation (active, inactive)

## Notes

- All endpoints use JSON for request/response
- CORS is configured for frontend origins (localhost:5173, localhost:3000, localhost:8080)
- The backend uses Supabase REST API for database operations
- Service role key is recommended for write operations to bypass RLS

