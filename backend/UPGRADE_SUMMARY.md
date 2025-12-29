# Java 21 Upgrade Summary

## ✅ Changes Made

### 1. Java Version Updated
- **From:** Java 17
- **To:** Java 21 (Latest LTS)
- Updated in `pom.xml`:
  - `java.version`: 21
  - `maven.compiler.source`: 21
  - `maven.compiler.target`: 21

### 2. Spring Boot Version Updated
- **From:** Spring Boot 3.2.0
- **To:** Spring Boot 3.3.5 (Latest stable)
- Provides better Java 21 support and performance improvements

### 3. Production Configuration
- Created `application-prod.yml` for production-specific settings
- Added environment variable support for all configurations
- Configured proper logging for production
- Added health check endpoint

### 4. CORS Configuration Enhanced
- Updated to support multiple production origins via environment variables
- Improved origin parsing and validation
- Added proper CORS headers for production

### 5. Docker Support
- Created `Dockerfile` for containerized deployment
- Created `docker-compose.yml` for easy local/production deployment
- Added `.dockerignore` for optimized builds
- Multi-stage build for smaller image size

### 6. Deployment Documentation
- `PRODUCTION_DEPLOYMENT.md` - Comprehensive deployment guide
- `QUICK_START.md` - Quick reference for common tasks
- `Procfile` - For Heroku and similar platforms
- `.env.example` - Template for environment variables

## 📋 Files Created/Modified

### Modified Files:
- `backend/pom.xml` - Updated Java and Spring Boot versions
- `backend/src/main/resources/application.yml` - Added profile support
- `backend/src/main/java/com/schoolsphere/config/CorsConfig.java` - Enhanced CORS

### New Files:
- `backend/src/main/resources/application-prod.yml` - Production config
- `backend/Dockerfile` - Docker container definition
- `backend/docker-compose.yml` - Docker Compose configuration
- `backend/.dockerignore` - Docker build exclusions
- `backend/Procfile` - Heroku/Platform deployment
- `backend/PRODUCTION_DEPLOYMENT.md` - Deployment guide
- `backend/QUICK_START.md` - Quick start guide
- `backend/.env.example` - Environment variables template
- `backend/check-java-version.sh` - Java version checker

## 🚀 Next Steps

### For Local Development:
1. **Install Java 21** (if not already installed):
   ```bash
   # macOS
   brew install openjdk@21
   
   # Ubuntu/Debian
   sudo apt-get install openjdk-21-jdk
   
   # Or download from https://adoptium.net/
   ```

2. **Verify Java version:**
   ```bash
   cd backend
   ./check-java-version.sh
   ```

3. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

### For Production Deployment:

1. **Set environment variables:**
   ```bash
   export SPRING_PROFILES_ACTIVE=prod
   export SUPABASE_URL=your_url
   export SUPABASE_ANON_KEY=your_key
   export SUPABASE_SERVICE_ROLE_KEY=your_key
   export CORS_ALLOWED_ORIGINS=https://looperp.lovable.app
   ```

2. **Deploy using Docker (Recommended):**
   ```bash
   docker-compose up -d
   ```

3. **Or deploy using JAR:**
   ```bash
   mvn clean package -DskipTests
   java -jar target/admin-backend-1.0.0.jar --spring.profiles.active=prod
   ```

## ⚠️ Important Notes

1. **Java 21 Required:** The application now requires Java 21. Make sure your production environment has Java 21 installed.

2. **Environment Variables:** All sensitive configuration should be set via environment variables in production. Never commit secrets.

3. **CORS Configuration:** Update `CORS_ALLOWED_ORIGINS` to include all your production frontend domains.

4. **Health Check:** The application includes a health check at `/api/health` for monitoring.

## 🔍 Verification

After deployment, verify the application is running:

```bash
# Health check
curl http://your-domain:3001/api/health

# Should return: {"status":"ok"}
```

## 📚 Documentation

- **Quick Start:** See `QUICK_START.md`
- **Full Deployment Guide:** See `PRODUCTION_DEPLOYMENT.md`
- **API Endpoints:** See `API_ENDPOINTS.md`

## 🐛 Troubleshooting

If you encounter issues:

1. **Java version mismatch:**
   ```bash
   ./check-java-version.sh
   ```

2. **Compilation errors:**
   ```bash
   mvn clean compile
   ```

3. **Port already in use:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

4. **Check logs:**
   ```bash
   tail -f logs/application.log  # If using file logging
   # Or check Docker logs
   docker logs schoolsphere-backend
   ```

