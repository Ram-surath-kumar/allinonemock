# SchoolSphere Admin Backend (Java Spring Boot)

## Overview
This is the Java Spring Boot backend for the SchoolSphere Admin system. It provides consolidated API endpoints that combine multiple data sources into single responses, reducing the number of API calls from the frontend.

## Technology Stack
- **Java 17**
- **Spring Boot 3.2.0**
- **Maven** (Build tool)
- **Supabase** (Database via REST API)
- **OkHttp** (HTTP Client)

## Setup Instructions

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Configuration

1. Create `application.yml` in `src/main/resources/` (already created) or set environment variables:
   ```bash
   export SUPABASE_URL=https://vzkbyzpqnojhlazwopvz.supabase.co
   export SUPABASE_ANON_KEY=your_anon_key
   export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Or create `application-local.yml`:
   ```yaml
   supabase:
     url: https://vzkbyzpqnojhlazwopvz.supabase.co
     anon-key: your_anon_key
     service-role-key: your_service_role_key
   ```

### Build and Run

```bash
# Build the project
mvn clean install

# Run the application
mvn spring-boot:run

# Or run the JAR
java -jar target/admin-backend-1.0.0.jar
```

The server will start on `http://localhost:3001/api`

## API Endpoints

### Consolidated Endpoints (Recommended)

#### Dashboard Data
```
GET /api/dashboard?userId={userId}&role={role}
```
Returns all dashboard data in a single response:
- Statistics (total students, departments, etc.)
- Recent activities
- Students list
- Departments list
- Notifications
- User info

#### Attendance Page Data
```
GET /api/attendance/page-data?userId={userId}&role={role}&date={date}
```
Returns all attendance page data in a single response:
- Students list (filtered by role)
- Departments list
- Attendance records for the date
- Teacher department IDs (if teacher)
- User info

### Other Endpoints

#### Health Check
```
GET /api/health
```

#### Mark Attendance
```
POST /api/attendance/mark
Body: {
  "records": [
    {
      "student_id": "uuid",
      "date": "2024-01-01",
      "status": "present",
      "marked_by": "uuid"
    }
  ]
}
```

#### User Management
```
POST /api/users
PUT /api/users/{id}
DELETE /api/users/{id}
```

## Key Features

1. **Consolidated APIs**: Multiple data sources combined into single endpoints
2. **Backend Validation**: All validation logic in Java backend
3. **Error Handling**: Comprehensive error handling with meaningful messages
4. **Type Safety**: Strong typing with Java
5. **CORS Support**: Configured for frontend origins

## Architecture

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data aggregation
- **Models**: Data transfer objects
- **Config**: Configuration classes (CORS, Supabase)

## Development

### Running in Development Mode
```bash
mvn spring-boot:run
```

Spring Boot DevTools will automatically reload on code changes.

### Building for Production
```bash
mvn clean package
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Recommended |

## Notes

- The backend uses Supabase REST API, not direct database connections
- Service role key is recommended for write operations to bypass RLS
- All validation is performed in the backend before database operations

