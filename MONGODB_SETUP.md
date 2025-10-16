# MongoDB Setup Instructions for Study Guardian

## Current Issue
❌ MongoDB is not connected. The backend starts but database operations won't work.

## Quick Fix Options (Choose ONE)

### Option 1: Docker MongoDB (FASTEST - 2 minutes)
**Requirements**: Docker Desktop must be running

```powershell
# 1. Start Docker Desktop from your Start Menu or taskbar
# 2. Wait for Docker to fully start (green icon)
# 3. Run this command:
cd c:\Users\zeesh\Desktop\project
docker-compose up -d

# 4. Verify it's running:
docker ps

# 5. You should see: study-guardian-mongodb
```

**Your .env is already configured for Docker!**

---

### Option 2: MongoDB Atlas (Cloud - FREE)
**If you have MongoDB Atlas account**

```powershell
# 1. Go to: https://cloud.mongodb.com
# 2. Network Access → Add IP Address → "Allow from Anywhere"
# 3. Database Access → Create user with username/password
# 4. Update .env file with your credentials:

# MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.dmlac5s.mongodb.net/study-guardian?retryWrites=true&w=majority
```

---

### Option 3: Local MongoDB Installation
**Download and install MongoDB Community Edition**

1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. Update .env:
   ```
   MONGODB_URI=mongodb://localhost:27017/study-guardian
   ```

---

## After MongoDB is Running

### 1. Start Backend
```powershell
cd c:\Users\zeesh\Desktop\project\backend
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ SERVER RUNNING SUCCESSFULLY!
```

### 2. Seed the Database
```powershell
# In a new terminal:
cd c:\Users\zeesh\Desktop\project\backend
npm run seed
npm run seed:goals
```

### 3. Start Frontend
```powershell
# In another terminal:
cd c:\Users\zeesh\Desktop\project\frontend
npm start
```

---

## Verify Everything Works

1. Backend health: http://localhost:5002/health
2. Frontend: http://localhost:3000
3. Login with test user:
   - Email: `user@example.com`
   - Password: `password123`

---

## Goal Tracker Features

Once MongoDB is connected and seeded, you'll see:
- ✅ Goal list at `/goals`
- ✅ Create new goals
- ✅ Track progress with bars
- ✅ Milestones and notifications
- ✅ Guardian sharing (privacy-aware)

---

## Need Help?

Run this command to check what's wrong:
```powershell
curl http://localhost:5002/health
```

If database shows "disconnected", MongoDB is not running.
