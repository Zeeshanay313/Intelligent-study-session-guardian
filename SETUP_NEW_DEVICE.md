# 🚀 Quick Setup on New Device

Follow these steps when setting up the project on your other device:

## 1️⃣ Clone the Repository
```bash
git clone https://github.com/Zeeshanay313/Intelligent-study-session-guardian.git
cd Intelligent-study-session-guardian
```

## 2️⃣ Setup Backend
```bash
cd backend
npm install
```

### Configure Environment Variables
Copy your `.env` file or create a new one with:
```env
MONGODB_URI=mongodb://localhost:27017/intelligent-study-session
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret
PORT=5004
NODE_ENV=development
```

### 🌱 Seed the Database (IMPORTANT!)
```bash
npm run seed
```

This will populate your database with:
- ✅ Community Challenges (9 challenges)
- ✅ Motivational Tips (250+ tips)
- ✅ Rewards & Badges (50+ achievements)

### Start the Backend
```bash
npm start
```
Backend will run on: http://localhost:5004

## 3️⃣ Setup Frontend
```bash
cd ../frontend-vite
npm install
```

### Configure Frontend Environment (if needed)
Create `.env` file:
```env
VITE_API_URL=http://localhost:5004
```

### Start the Frontend
```bash
npm run dev
```
Frontend will run on: http://localhost:3000

## 4️⃣ Verify Everything Works

1. Open http://localhost:3000
2. Sign up or login
3. Navigate to **Motivation** page → Should see challenges
4. Navigate to **Rewards** page → Should see badges
5. Complete a study session → Should earn points

## ⚠️ Troubleshooting

### "No challenges or badges showing"
→ Make sure you ran `npm run seed` in the backend folder

### "Cannot connect to database"
→ Verify MongoDB is running: `mongosh` or check MongoDB Compass
→ Verify MONGODB_URI in .env is correct

### "Port already in use"
→ Backend: Change PORT in .env
→ Frontend: Vite will auto-suggest another port

### "Seeds already exist" message
→ This is normal! Seeds are idempotent (safe to run multiple times)
→ They won't duplicate data

## 📊 Verify Database Contents

```bash
mongosh
use intelligent-study-session
db.communitychallenges.countDocuments()  # Should return 9
db.motivationaltips.countDocuments()     # Should return 250+
db.rewards.countDocuments()               # Should return 50+
```

## 🎯 Next Steps

After setup:
1. Create your account
2. Complete your first study session
3. Join a community challenge
4. Start earning badges!

## 📝 Notes

- The seed data is the same on all devices (by design)
- User accounts are device-specific (stored locally in MongoDB)
- To sync user data between devices, you'd need a shared MongoDB instance
- Seeds only populate shared content (challenges, tips, badges)
- Your personal progress, goals, and sessions are stored per database

---

**Need help?** Check [backend/src/seeds/README.md](backend/src/seeds/README.md) for detailed seeding documentation.
