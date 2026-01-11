# Vercel Deployment Guide

This guide will walk you through deploying your SchoolSphere Admin application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your project pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your Supabase credentials

## Deployment Steps

### Step 1: Install Vercel CLI (Optional but Recommended)

```bash
npm i -g vercel
```

### Step 2: Prepare Your Project

The project is already configured for Vercel deployment with:
- `vercel.json` - Vercel configuration
- `api/index.js` - Serverless function wrapper
- `.vercelignore` - Files to exclude from deployment

### Step 3: Set Up Environment Variables

You need to configure the following environment variables in Vercel:

#### Frontend Environment Variables

1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
VITE_API_URL=https://your-project.vercel.app/api
```

**Note:** Replace `your-project.vercel.app` with your actual Vercel deployment URL. You can update this after the first deployment.

#### Backend/API Environment Variables

Add these in the same Environment Variables section:

```
SUPABASE_URL=https://vzkbyzpqnojhlazwopvz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** 
- Replace `your_service_role_key_here` with your actual Supabase Service Role Key
- You can find this in your Supabase project: **Settings** → **API** → **Service Role Key**
- **Never expose the Service Role Key in client-side code**

### Step 4: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended for First Deployment)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect the project settings
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)
5. Add all environment variables from Step 3
6. Click **Deploy**

#### Option B: Deploy via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

### Step 5: Update API URL After Deployment

After your first deployment:

1. Note your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
2. Go to **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://your-project.vercel.app/api`
4. Redeploy the project (or wait for automatic redeployment)

### Step 6: Verify Deployment

1. Visit your deployment URL
2. Check the API health endpoint: `https://your-project.vercel.app/api/health`
3. Test the application functionality

## Project Structure for Vercel

```
schoolsphere-admin/
├── api/
│   └── index.js          # Serverless function wrapper
├── server/
│   ├── routes/           # API route handlers
│   ├── common.js         # Shared utilities
│   └── index.js          # Express app (for local dev)
├── src/                  # Frontend React app
├── vercel.json           # Vercel configuration
├── .vercelignore         # Files to exclude
└── package.json          # Root dependencies
```

## How It Works

1. **Frontend:** Vite builds your React app to the `dist` folder, which Vercel serves as static files
2. **Backend:** The Express app in `api/index.js` runs as a Vercel serverless function
3. **API Routes:** All `/api/*` requests are routed to the serverless function
4. **Environment Variables:** Available to both frontend (VITE_*) and backend (all others)

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json` (not just `server/package.json`)
- Ensure Node.js version is compatible (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard

### API Not Working

- Verify environment variables are set correctly
- Check that `VITE_API_URL` points to your Vercel deployment URL
- Test the health endpoint: `https://your-project.vercel.app/api/health`
- Check Vercel function logs in the dashboard

### CORS Errors

- The CORS configuration in `api/index.js` allows all origins in Vercel
- If you need to restrict origins, update the CORS configuration

### Environment Variables Not Working

- Ensure variables are set for the correct environment (Production, Preview, Development)
- Frontend variables must start with `VITE_` to be accessible in the browser
- Redeploy after adding/updating environment variables

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `VITE_API_URL` to use your custom domain

## Continuous Deployment

Vercel automatically deploys:
- **Production:** Every push to your main/master branch
- **Preview:** Every push to other branches and pull requests

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Environment Variables](https://vercel.com/docs/environment-variables)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Vercel function logs
3. Verify all environment variables are set
4. Test API endpoints directly

