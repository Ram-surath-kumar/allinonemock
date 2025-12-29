# Production Deployment Guide

This guide covers deploying the SchoolSphere Admin Backend to production environments.

## Prerequisites

- Java 21 JDK installed
- Maven 3.6+ installed
- Docker (optional, for containerized deployment)
- Environment variables configured

## Java Version

The project uses **Java 21** (latest LTS version) with Spring Boot 3.3.5.

### Verify Java Version

```bash
java -version
# Should show: openjdk version "21.x.x" or similar
```

## Environment Variables

Create a `.env` file or set these environment variables in your production environment:

```bash
# Server Configuration
PORT=3001
SPRING_PROFILES_ACTIVE=prod

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://looperp.lovable.app,https://yourdomain.com
```

**Important Security Notes:**
- Never commit `.env` files or expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Use environment variables or secure secret management systems
- Rotate keys regularly

## Deployment Options

### Option 1: Traditional JAR Deployment

1. **Build the application:**
   ```bash
   cd backend
   mvn clean package -DskipTests
   ```

2. **Run the application:**
   ```bash
   java -jar target/admin-backend-1.0.0.jar --spring.profiles.active=prod
   ```

3. **With environment variables:**
   ```bash
   export SPRING_PROFILES_ACTIVE=prod
   export SUPABASE_URL=your_url
   export SUPABASE_ANON_KEY=your_key
   export SUPABASE_SERVICE_ROLE_KEY=your_service_key
   export CORS_ALLOWED_ORIGINS=https://looperp.lovable.app
   java -jar target/admin-backend-1.0.0.jar
   ```

### Option 2: Docker Deployment

1. **Build Docker image:**
   ```bash
   cd backend
   docker build -t schoolsphere-backend:latest .
   ```

2. **Run with Docker:**
   ```bash
   docker run -d \
     --name schoolsphere-backend \
     -p 3001:3001 \
     -e SPRING_PROFILES_ACTIVE=prod \
     -e SUPABASE_URL=your_url \
     -e SUPABASE_ANON_KEY=your_key \
     -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
     -e CORS_ALLOWED_ORIGINS=https://looperp.lovable.app \
     schoolsphere-backend:latest
   ```

3. **Using Docker Compose:**
   ```bash
   cd backend
   # Create .env file with your variables
   docker-compose up -d
   ```

### Option 3: Cloud Platform Deployment

#### Heroku

1. **Create `Procfile`:**
   ```
   web: java -jar target/admin-backend-1.0.0.jar --spring.profiles.active=prod
   ```

2. **Deploy:**
   ```bash
   heroku create your-app-name
   heroku config:set SPRING_PROFILES_ACTIVE=prod
   heroku config:set SUPABASE_URL=your_url
   heroku config:set SUPABASE_ANON_KEY=your_key
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_service_key
   heroku config:set CORS_ALLOWED_ORIGINS=https://looperp.lovable.app
   git push heroku main
   ```

#### AWS Elastic Beanstalk

1. Create `Procfile` (same as Heroku)
2. Package application:
   ```bash
   mvn clean package -DskipTests
   zip -r deploy.zip target/admin-backend-1.0.0.jar Procfile
   ```
3. Upload to Elastic Beanstalk and configure environment variables

#### Railway / Render / Fly.io

These platforms support Docker deployments. Use the provided `Dockerfile` and configure environment variables in their dashboards.

## Health Check

The application includes a health check endpoint:

```bash
curl http://your-domain:3001/api/health
```

Expected response:
```json
{"status":"ok"}
```

## Monitoring

### Logs

Production logs are written to `logs/application.log` (if using file logging) or stdout/stderr.

### Application Metrics

Monitor:
- Response times
- Error rates
- Memory usage
- Database connection pool

## CORS Configuration

The application is configured to allow requests from:
- `https://looperp.lovable.app` (production frontend)
- Additional origins can be added via `CORS_ALLOWED_ORIGINS` environment variable

To add more origins:
```bash
export CORS_ALLOWED_ORIGINS=https://looperp.lovable.app,https://yourdomain.com,https://anotherdomain.com
```

## Security Best Practices

1. **Use HTTPS in production** - Never expose the backend over HTTP in production
2. **Set strong environment variables** - Use secure secret management
3. **Enable firewall rules** - Only allow necessary ports
4. **Regular updates** - Keep Java and dependencies updated
5. **Monitor logs** - Set up log aggregation and monitoring
6. **Rate limiting** - Consider adding rate limiting for API endpoints
7. **Authentication** - Ensure proper authentication for sensitive endpoints

## Troubleshooting

### Application won't start

1. Check Java version: `java -version` (should be 21)
2. Check port availability: `lsof -i :3001`
3. Check environment variables are set correctly
4. Check logs for errors

### CORS errors

1. Verify `CORS_ALLOWED_ORIGINS` includes your frontend domain
2. Check that the origin matches exactly (including protocol and port)
3. Restart the application after changing CORS configuration

### Database connection issues

1. Verify Supabase credentials are correct
2. Check network connectivity to Supabase
3. Verify RLS policies allow service role operations

## Performance Tuning

For production, consider:

1. **JVM Options:**
   ```bash
   java -Xms512m -Xmx1024m -jar app.jar
   ```

2. **Connection Pooling:** Already configured in Spring Boot

3. **Caching:** Consider adding Redis for caching

4. **Load Balancing:** Use a load balancer for multiple instances

## Backup and Recovery

1. **Database:** Ensure Supabase backups are configured
2. **Application logs:** Archive logs regularly
3. **Configuration:** Version control all configuration changes

## Support

For issues or questions:
1. Check application logs
2. Review this documentation
3. Check Spring Boot documentation: https://spring.io/projects/spring-boot

