# Vercel API Setup Guide

## What Was Fixed

### Problem
The frontend was configured with `VITE_API_URL=https://loopverse-erp.vercel.app/api`, but the backend API was not accessible, causing errors like:
- "Backend API not available. The server is not configured."
- Users not loading
- Dashboard data not loading

### Root Causes
1. **ApiClient Constructor**: The constructor was rejecting same-origin URLs (when API is on the same domain as frontend)
2. **Missing Serverless Function**: No Vercel serverless function wrapper existed to handle `/api/*` requests
3. **Vercel Routing**: `vercel.json` didn't route `/api/*` to the backend

## Solutions Applied

### 1. Fixed ApiClient Constructor (`src/services/api.ts`)
- Now allows same-origin URLs when `VITE_API_URL` is explicitly set
- Trusts user configuration instead of rejecting it
- Still prevents empty/relative URLs from hitting the frontend

### 2. Created Vercel Serverless Function (`api/index.js`)
- Wraps Express app with `serverless-http` for Vercel compatibility
- Handles all `/api/*` requests
- Preserves request paths correctly

### 3. Updated Vercel Configuration (`vercel.json`)
- Added rewrite rule: `/api/:path*` → `/api/index.js`
- Maintains catch-all for frontend routes

### 4. Installed Dependencies
- Added `serverless-http` package for Express compatibility

## Deployment Steps

1. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "Fix Vercel API routing and same-origin detection"
   git push
   ```

2. **Vercel Will Auto-Deploy**:
   - Vercel will detect the new `api/` directory
   - It will install dependencies (including `serverless-http`)
   - The serverless function will be created automatically

3. **Verify Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure `VITE_API_URL` is set to: `https://loopverse-erp.vercel.app/api`
   - Ensure `SUPABASE_ANON_KEY` is set (if using Supabase)

4. **Test the API**:
   - Visit: `https://loopverse-erp.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Backend API is running"}`
   - Check browser console - API errors should be gone

## How It Works

1. **Frontend Request**: `https://loopverse-erp.vercel.app/api/users`
2. **Vercel Rewrite**: Routes to `/api/index.js` serverless function
3. **Serverless Function**: Wraps Express app with `serverless-http`
4. **Express App**: Handles `/api/users` route and returns JSON
5. **Response**: Returns to frontend as JSON

## Troubleshooting

### If API still returns HTML:
- Check Vercel deployment logs for errors
- Verify `api/index.js` exists in deployment
- Check that `serverless-http` is installed

### If users still not loading:
- Check browser console for specific API errors
- Verify Supabase environment variables are set
- Check that backend routes are working: `/api/health`

### If build fails:
- Ensure `server/` directory is included in deployment
- Check that all server dependencies are in root `package.json` or `server/package.json`
- Verify Node.js version compatibility

## Next Steps

After deployment:
1. ✅ Test login functionality
2. ✅ Verify users are loading
3. ✅ Check dashboard data loads
4. ✅ Test other API endpoints

If issues persist, check Vercel function logs in the dashboard.
