# Setup Service Role Key for Department Creation

## Problem
When trying to create a department, you're getting this error:
```
"new row violates row-level security policy for table \"departments\""
```

This happens because the server needs the **Service Role Key** to bypass Row Level Security (RLS) policies for write operations.

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find the **"service_role"** key (NOT the "anon" key)
5. Click the **eye icon** to reveal it, then copy it

⚠️ **IMPORTANT**: The service role key has full access to your database and should NEVER be exposed in client-side code. Only use it in server-side code.

### Step 2: Create/Update the .env File

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Create a `.env` file (if it doesn't exist):
   ```bash
   touch .env
   ```

3. Add the following content to `server/.env`:
   ```env
   PORT=3001
   SUPABASE_URL=https://vzkbyzpqnojhlazwopvz.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY
   SUPABASE_SERVICE_ROLE_KEY=paste_your_service_role_key_here
   ```

4. Replace `paste_your_service_role_key_here` with the actual service role key you copied from Step 1.

### Step 3: Restart the Server

After adding the service role key, you MUST restart the backend server:

1. Stop the current server (if running):
   ```bash
   # Find and kill the process
   pkill -f "node.*index.js"
   ```

2. Start the server again:
   ```bash
   cd server
   node index.js
   ```

   Or if you're using npm:
   ```bash
   cd server
   npm run dev
   ```

### Step 4: Verify It Works

1. Check the server console - you should NOT see the warning:
   ```
   ⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found
   ```

2. Try creating a department again - it should work now!

## Alternative: Disable RLS (NOT RECOMMENDED)

If you cannot use the service role key, you can disable RLS on the departments table, but this is **NOT RECOMMENDED** for production:

1. Go to Supabase Dashboard → Table Editor
2. Select the `departments` table
3. Go to Settings → Disable Row Level Security

⚠️ **Warning**: This will allow anyone with the anon key to insert/update/delete departments, which is a security risk.

## Troubleshooting

- **Still getting RLS error?** Make sure:
  1. The `.env` file is in the `server` directory (not the root)
  2. The service role key is correct (no extra spaces, quotes, etc.)
  3. The server was restarted after adding the key
  4. Check server console for any error messages

- **Server won't start?** Check:
  1. All required packages are installed: `cd server && npm install`
  2. The `.env` file syntax is correct (no spaces around `=`)
  3. Port 3001 is not already in use

