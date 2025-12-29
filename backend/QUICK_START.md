# Quick Start Guide

## Local Development

1. **Ensure Java 21 is installed:**
   ```bash
   java -version
   # Should show Java 21
   ```

2. **Set environment variables (optional for local dev):**
   ```bash
   export SUPABASE_URL=your_url
   export SUPABASE_ANON_KEY=your_key
   export SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

3. **Run the application:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

   The server will start on `http://localhost:3001/api`

## Production Deployment

### Using Docker (Recommended)

1. **Build and run:**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Or build manually:**
   ```bash
   docker build -t schoolsphere-backend .
   docker run -d -p 3001:3001 \
     -e SPRING_PROFILES_ACTIVE=prod \
     -e SUPABASE_URL=your_url \
     -e SUPABASE_ANON_KEY=your_key \
     -e SUPABASE_SERVICE_ROLE_KEY=your_key \
     -e CORS_ALLOWED_ORIGINS=https://looperp.lovable.app \
     schoolsphere-backend
   ```

### Using JAR File

1. **Build:**
   ```bash
   mvn clean package -DskipTests
   ```

2. **Run:**
   ```bash
   java -jar target/admin-backend-1.0.0.jar --spring.profiles.active=prod
   ```

## Verify Deployment

```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok"}`

## Environment Variables

Copy `.env.example` to `.env` and fill in your values, or set them as environment variables.

See `PRODUCTION_DEPLOYMENT.md` for detailed deployment instructions.

