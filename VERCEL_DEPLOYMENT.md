# Vercel Deployment Guide

## Problem
When deploying to Vercel, the login fails with errors like:
- `Unexpected token '<', "<!doctype "... is not valid JSON`
- `Backend API not available`

This happens because the frontend is trying to reach the backend API at `http://localhost:3001/api`, which doesn't exist in production.

## Solution

### Option 1: Deploy Backend Separately (Recommended)

1. **Deploy your backend server** to a service like:
   - Railway
   - Render
   - Fly.io
   - DigitalOcean App Platform
   - Or any Node.js hosting service

2. **Set Environment Variable in Vercel:**
   - Go to your Vercel project settings
   - Navigate to **Settings** → **Environment Variables**
   - Add: `VITE_API_URL` = `https://your-backend-url.com/api`
   - Redeploy your frontend

### Option 2: Use Supabase Directly (Current Fallback)

The application now automatically falls back to using Supabase directly when the backend API is not available. This means:

- ✅ Login will work without a backend server
- ✅ User data will be loaded directly from Supabase
- ⚠️ Some features that require the backend API may not work

### Option 3: Use Vercel Serverless Functions

You can deploy your backend API as Vercel serverless functions. Update `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Then create API routes in `api/` directory.

## Environment Variables for Vercel

Add these in **Vercel Project Settings** → **Environment Variables**:

### Required:
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app/api`)
  - Leave empty if using Supabase direct fallback

### Optional (if using Supabase directly):
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

## Current Behavior

The application now:
1. ✅ Tries to use the backend API first (if `VITE_API_URL` is set)
2. ✅ Automatically falls back to Supabase direct queries if backend is unavailable
3. ✅ Provides clear error messages when backend is not available
4. ✅ Handles HTML error pages gracefully

## Testing

After deployment:
1. Try logging in - it should work with Supabase fallback
2. Check browser console for any API errors
3. If you see "Backend API not available" warnings, that's expected if backend isn't deployed

## Next Steps

1. **For Production**: Deploy your backend server and set `VITE_API_URL`
2. **For Development**: The fallback ensures login works even without backend
3. **Monitor**: Check Vercel logs for any API-related errors
