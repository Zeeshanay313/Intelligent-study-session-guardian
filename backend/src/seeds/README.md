# Database Seeds

This directory contains seed scripts to populate your database with default data for the motivation and rewards features.

## 🎯 What Gets Seeded

- **Community Challenges** - Active challenges users can join
- **Motivational Tips** - Inspirational study tips shown to users
- **Rewards & Badges** - Achievement badges and rewards for gamification

## 🚀 Quick Start (New Device Setup)

After cloning the repository on a new device, run:

```bash
cd backend
npm run seed
```

This will populate your local MongoDB database with all necessary data.

## 📝 Individual Seed Scripts

You can also run seeds individually:

```bash
# Seed only community challenges
npm run seed:challenges

# Seed only motivational tips
npm run seed:tips

# Seed only rewards and badges
npm run seed:rewards
```

## 🔄 Re-seeding

All seed scripts are idempotent (safe to run multiple times). They will:
- Skip existing records (by name/title)
- Only add new records
- Never duplicate data

## 📋 What's Included

### Community Challenges
- **7-Day Study Streak** - Build daily study habits
- **Focus Master Challenge** - Complete focused sessions
- **Weekend Warrior** - Weekend study goals
- **Early Bird Special** - Morning study challenges
- **Night Owl Challenge** - Evening study goals
- **Speed Demon** - Quick focused sessions
- **Marathon Runner** - Long study sessions
- **Time Master** - Total study hours
- **Perfect Score** - Study without breaks

### Rewards & Badges
- **Streak Badges** - First Flame, Week Warrior, Monthly Master, etc.
- **Session Badges** - First Step, Ten Strong, Century Club, etc.
- **Time Badges** - Hour Hero, Time Lord, Marathon Scholar, etc.
- **Focus Badges** - Distraction Free, Focus Fighter, Zen Master
- **Goal Badges** - Goal Getter, Goal Master, Perfect Execution
- **Milestone Achievements** - Level milestones and special achievements

### Motivational Tips
- Study technique tips
- Focus and productivity advice
- Break and recovery tips
- Goal-setting guidance
- Time management strategies
- Over 250 unique tips!

## 🔧 Troubleshooting

### Connection Issues
Make sure your `.env` file has the correct MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/intelligent-study-session
```

### Port Conflicts
If MongoDB is running on a different port, update `MONGODB_URI` in your `.env` file.

### Data Not Showing
1. Verify seeds ran successfully (check console output)
2. Confirm you're connected to the correct database
3. Check MongoDB with: `mongosh` and run `use intelligent-study-session` then `show collections`

## 💾 Database Collections

The seeds create/update these collections:
- `communitychallenges`
- `motivationaltips`
- `rewards`

## 🔐 Notes

- Seeds respect existing data (no overwrites)
- Safe to run on production (but not recommended without review)
- All dates are relative to current date for active challenges
- Data is designed to be visible immediately after seeding
