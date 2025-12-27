# IMMEDIATE FIX: Create Department "CPEI"

## Quick Solution (Choose ONE):

### Option 1: Disable RLS (Fastest - 30 seconds)

1. **Open Supabase SQL Editor**: 
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/sql/new

2. **Copy and paste this SQL**:
   ```sql
   ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
   ```

3. **Click "Run"** (or press Cmd/Ctrl + Enter)

4. **Try creating department "CPEI" again** - it should work now! ✅

---

### Option 2: Add Service Role Key (More Secure - 2 minutes)

1. **Get Service Role Key**:
   - Go to: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/settings/api
   - Scroll to "service_role" section
   - Click eye icon 👁️ to reveal
   - Copy the key

2. **Update server/.env**:
   ```bash
   cd server
   nano .env  # or use any text editor
   ```
   
   Change this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```
   
   To:
   ```
   SUPABASE_SERVICE_ROLE_KEY=paste_your_actual_key_here
   ```

3. **Restart server**:
   ```bash
   pkill -f "node.*index.js"
   cd server
   node index.js
   ```

4. **Try creating department "CPEI"** - it should work! ✅

---

## Which Option to Choose?

- **Option 1 (Disable RLS)**: Faster, but less secure. Good for development.
- **Option 2 (Service Role Key)**: More secure, recommended for production.

**I recommend Option 1 for now** to get it working immediately, then switch to Option 2 later.

