# Backend Server Quick Fix Guide

## The Problem
The command `npm run dev` only starts the **frontend** (port 5173), NOT the backend (port 3001).

## Permanent Solution

### ✅ Option 1: Use the Fixed Startup Script (RECOMMENDED)
```bash
# Just double-click this file:
start-dev.bat
```
This opens TWO windows:
- **Window 1:** Backend (port 3001)
- **Window 2:** Frontend (port 5173)

**Keep both windows open while developing!**

---

### ✅ Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

### ✅ Option 3: Use dev:all Command
```bash
npm run dev:all
```
*(Windows only - starts both in separate windows)*

---

## Quick Check: Is Backend Running?

Open browser: http://localhost:3001/api/health

**Expected:** `{"status":"ok","message":"Backend API is running"}`

**If you see error:** Backend is not running - use one of the solutions above

---

## Why This Keeps Happening

The `package.json` scripts are:
- `npm run dev` → Frontend only (Vite)
- `npm run server` → Backend only (Node.js)
- `npm run dev:all` → Both servers

**You always need BOTH running for the app to work!**
