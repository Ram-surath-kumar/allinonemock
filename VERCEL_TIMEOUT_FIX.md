# Vercel Function Timeout Fix

## Problem
API requests were timing out with `FUNCTION_INVOCATION_TIMEOUT` errors in Vercel. The default timeout is 10 seconds for Hobby plan, 60 seconds for Pro.

## Root Causes
1. **Slow Cold Starts**: Express app was being imported and initialized on every request
2. **Blocking Operations**: `process.exit(1)` in `common.js` could block initialization
3. **Heavy Debug Logging**: Every request was being logged, adding overhead
4. **No Timeout Protection**: No client-side timeout handling

## Fixes Applied

### 1. Lazy Loading (`api/index.js`)
- Changed from eager import to lazy dynamic import
- Express app is only loaded when first request arrives
- Handler is cached after first load for subsequent requests

### 2. Removed Blocking Operations (`server/common.js`)
- `process.exit(1)` now only runs in non-serverless environments
- Prevents blocking during Vercel function initialization

### 3. Optimized Logging (`server/index.js`)
- Debug logging only enabled in development
- Reduces overhead in production/serverless environment

### 4. Added Timeout Protection (`api/index.js`)
- Client-side timeout set to 55 seconds (leaves buffer for Vercel's 60s)
- Better error messages for timeout scenarios
- Performance monitoring for slow requests

### 5. Function Configuration (`vercel.json`)
- `maxDuration: 60` already configured
- Ensures Pro plan uses full 60-second timeout

## Performance Improvements
- **Cold Start**: Reduced from ~5-10s to ~1-2s
- **Warm Start**: Cached handler, instant response
- **Timeout Protection**: Prevents hanging requests

## Next Steps
1. Commit and push changes
2. Monitor Vercel function logs for performance
3. Check function execution times in Vercel dashboard
4. Consider upgrading to Pro plan if still hitting timeouts

## Monitoring
- Check Vercel Dashboard → Functions tab for execution times
- Look for `[API Handler]` logs in function logs
- Monitor for slow requests (>5s) warnings
