# Quick Fix: Add Service Role Key

## The Problem
Department creation is failing because the server needs the Supabase Service Role Key to bypass Row Level Security (RLS).

## Quick Solution (2 minutes)

### Step 1: Get Your Service Role Key

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (the one with URL: `vzkbyzpqnojhlazwopvz.supabase.co`)
3. **Go to**: Settings (gear icon) → **API**
4. **Find**: "service_role" key section (scroll down, it's below the anon key)
5. **Click the eye icon** 👁️ to reveal the key
6. **Copy the entire key** (it's a long string starting with `eyJ...`)

### Step 2: Add It to .env File

1. **Open the file**: `server/.env`
2. **Find this line**:
   ```
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
3. **Replace** `YOUR_SERVICE_ROLE_KEY_HERE` with the key you copied
4. **Save the file**

### Step 3: Restart Server

The server should auto-restart, but if it doesn't:

```bash
# Stop server
pkill -f "node.*index.js"

# Start server
cd server
node index.js
```

### Step 4: Test

Try creating a department again - it should work now! ✅

---

## Still Not Working?

1. **Check server console** - you should NOT see the warning about missing service role key
2. **Verify the key** - make sure there are no extra spaces or quotes in the .env file
3. **Check file location** - the .env file must be in the `server/` directory (not root)

## Security Note

⚠️ **Never commit the .env file to git!** The service role key has full database access and should be kept secret.

