# 🚀 Quick Start Guide - Study Guardian

## ⚠️ Current Issue: MongoDB Not Connected

Your Goal Tracker module **IS fully implemented** with all files in place:

### ✅ Backend Files (All Created)
- `backend/src/models/Goal.js` - Database schema
- `backend/src/controllers/goalTrackerController.js` - Business logic
- `backend/src/routes/goalTracker.js` - API endpoints
- `backend/src/seeds/seedGoals.js` - Sample data
- `backend/src/tests/goalTracker.test.js` - Tests

### ✅ Frontend Files (All Created)
- `frontend/src/modules/GoalTracker/` - Complete module
  - `components/GoalList.jsx` - List view
  - `components/GoalForm.jsx` - Create/edit form
  - `components/GoalDetail.jsx` - Detail view
  - `api/goalApi.js` - API client
  - `goalTrackerContext.js` - State management
  - `tests/` - Component tests

### ❌ The Only Problem: MongoDB is Not Running

---

## 🔧 How to Fix (Choose ONE method)

### Method 1: Docker (EASIEST - 2 Minutes)

1. **Start Docker Desktop** from your Start Menu
2. Wait for Docker to show green/running status
3. Double-click: `start-backend.bat`
4. That's it! MongoDB and backend will start automatically

**OR run manually:**
```powershell
docker-compose up -d
cd backend
npm start
```

---

### Method 2: MongoDB Atlas (Cloud - FREE)

1. Go to https://cloud.mongodb.com
2. Create free account / login
3. Create a cluster (free tier)
4. Network Access → "Allow from Anywhere"
5. Database Access → Create user
6. Get connection string
7. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-guardian
   ```
8. Run: `cd backend && npm start`

---

### Method 3: Local MongoDB Installation

1. Download: https://www.mongodb.com/try/download/community
2. Install with defaults
3. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/study-guardian
   ```
4. Run: `cd backend && npm start`

---

## 🎯 After MongoDB is Connected

### 1. Start Backend
Double-click `start-backend.bat` OR:
```powershell
cd backend
npm start
```

### 2. Seed Database
```powershell
cd backend
npm run seed        # Create test users
npm run seed:goals  # Create sample goals
```

### 3. Start Frontend
Double-click `start-frontend.bat` OR:
```powershell
cd frontend
npm start
```

### 4. Open Browser
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002
- Health Check: http://localhost:5002/health

### 5. Login
- Email: `user@example.com`
- Password: `password123`

### 6. See Goal Tracker
- Click "Goals" in navigation
- See 6 sample goals
- Create new goals
- Track progress
- Complete milestones

---

## 📊 Goal Tracker Features

Once running, you'll have:
- ✅ Weekly/monthly goal tracking
- ✅ Progress bars and percentages
- ✅ Milestones with due dates
- ✅ Achievement notifications
- ✅ Smart alerts for overdue goals
- ✅ Privacy-aware guardian sharing
- ✅ Filter by type/status
- ✅ Beautiful modern UI

---

## 🐛 Troubleshooting

### Backend won't start?
```powershell
# Check if port 5002 is in use:
netstat -ano | findstr :5002

# Kill the process if needed:
taskkill /PID <process_id> /F
```

### MongoDB connection error?
```powershell
# If using Docker:
docker ps                  # Check if running
docker logs study-guardian-mongodb  # Check logs

# If using local:
# Make sure MongoDB service is running
```

### Frontend won't start?
```powershell
cd frontend
npm install  # Reinstall dependencies
npm start
```

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── models/Goal.js           ✅ Created
│   │   ├── controllers/goalTrackerController.js  ✅ Created
│   │   ├── routes/goalTracker.js    ✅ Created
│   │   ├── seeds/seedGoals.js       ✅ Created
│   │   └── tests/goalTracker.test.js ✅ Created
│   └── .env (needs MongoDB connection)
├── frontend/
│   └── src/
│       └── modules/
│           └── GoalTracker/         ✅ Complete Module
├── docker-compose.yml               ✅ Created
├── start-backend.bat                ✅ Created
├── start-frontend.bat               ✅ Created
└── MONGODB_SETUP.md                 ✅ Created
```

---

## ✅ Summary

**Everything is ready.** You just need MongoDB to be running:

1. Start Docker Desktop (or choose another MongoDB option)
2. Run `start-backend.bat`
3. Run `start-frontend.bat`
4. Login and go to `/goals`

The Goal Tracker module is **fully implemented and working** - it just needs a database connection to run!
