# 🚀 Quick Start - Testing New Features

## Prerequisites
```bash
# Ensure you have Node.js 16+ installed
node --version

# Install dependencies if not already done
cd frontend-vite
npm install

cd ../backend
npm install
```

---

## Start the Application

### Option 1: Full Stack (Frontend + Backend)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
Should see: `Server running on http://localhost:5004`

**Terminal 2 - Frontend:**
```bash
cd frontend-vite
npm run dev
```
Should see: `Local: http://localhost:3000`

### Option 2: Frontend Only (Mock API)

If you don't need OAuth or real backend:
```bash
cd frontend-vite
npm run dev
```
All features work with mock data!

---

## Test the New Features

### 1. **Timer Presets** (2 minutes)
1. Open http://localhost:3000
2. Login with demo account (or create account)
3. Go to **Focus** page
4. Click **Layers icon** (top right)
5. Click **"New Preset"**
6. Create preset:
   - Name: "Quick Session"
   - Color: Blue
   - Icon: 📚
   - Work: 10 minutes
   - Break: 2 minutes
7. Click **"Create Preset"**
8. See preset in quick grid
9. Click preset tile to apply
10. ✅ Success toast should appear!

### 2. **Session End Modal** (3 minutes)
1. On Focus page with preset applied
2. Change timer to 1 minute (for testing)
3. Click **"Start"**
4. Wait for timer to complete
5. **SessionEndModal** should popup! 🎉
6. Check:
   - ✅ Hear beep sound
   - ✅ See session summary
   - ✅ See break suggestion
   - ✅ Click "Start 5 Min Break"
7. Timer should switch to break mode

### 3. **Notification Toasts** (1 minute)
1. Create a goal → ✅ Green success toast
2. Update goal progress → ✅ Green success toast
3. Try invalid action → ❌ Red error toast
4. Stop timer → ℹ️ Blue info toast
5. Click "Dismiss all" if multiple toasts
6. ✅ All should auto-dismiss after 4 seconds

### 4. **Quick Progress Buttons** (2 minutes)
1. Go to **Goals** page
2. Click **"New Goal"**
3. Create: "Study 100 hours"
4. Find goal card
5. Click **"+1"** button → Progress +1
6. Click **"+5"** button → Progress +5
7. Click **"Custom"** → Enter 10 → Progress +10
8. ✅ Watch progress bar animate!

### 5. **Milestones** (1 minute)
1. Find goal with milestones (or check mock data)
2. Click **"Milestones (X/Y)"** to expand
3. See milestone list
4. Check completed vs incomplete styling
5. Click again to collapse
6. ✅ Smooth expand/collapse animation

### 6. **Dark Mode** (30 seconds)
1. Click **moon icon** (top right)
2. Toggle dark mode
3. Check all pages:
   - Focus page
   - Goals page
   - Dashboard
   - Modals
4. ✅ Everything should look good in dark mode!

---

## Quick Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
npm run dev -- --port 3001
```

### Module Not Found
```bash
cd frontend-vite
rm -rf node_modules package-lock.json
npm install
```

### API Errors
- Check backend is running on port 5004
- Or just use mock API (works without backend!)

### Dark Mode Not Working
- Clear localStorage
- Hard refresh (Ctrl+Shift+R)

---

## Feature Testing Order

**Recommended order for fastest testing:**

1. ✅ **Notifications** (automatic - you'll see them everywhere)
2. ✅ **Quick Progress** (Goals page - instant feedback)
3. ✅ **Timer Presets** (Focus page - create one preset)
4. ✅ **Session End** (Focus page - use 1-min timer for testing)
5. ✅ **Milestones** (Goals page - check existing goals)
6. ✅ **Dark Mode** (toggle and check all pages)
7. ✅ **OAuth** (requires backend - optional for now)

---

## Expected Results ✨

After testing, you should see:

### Focus Page
- Layers icon for presets
- Quick presets grid
- Apply preset functionality
- SessionEndModal after completion
- Break suggestions

### Goals Page
- +1, +5, Custom buttons on each goal
- Expandable milestone sections
- Due date warnings (orange for <7 days)
- Overdue alerts (red)
- Progress bar animations

### Everywhere
- Notification toasts (5 types)
- Success/error feedback
- Dark mode support
- Smooth animations

---

## Performance Expectations

- **Page Load**: <2 seconds
- **Toast Animation**: Smooth 300ms slide-in
- **Progress Update**: Instant (<100ms)
- **Modal Open**: Smooth transition
- **Dark Mode Toggle**: Instant switch

---

## Next Steps After Testing

### If Everything Works ✅
```bash
# Delete old frontend
rm -rf frontend

# Update documentation
# Commit changes
git add .
git commit -m "feat: Complete migration to Vite with all advanced features"

# Deploy
npm run build
```

### If Issues Found 🐛
1. Open `TESTING_CHECKLIST.md`
2. Document issues in Bug Tracking section
3. Check browser console for errors
4. Report in project issues

---

## Key Files Reference

```
frontend-vite/src/
├── components/
│   ├── Timer/
│   │   ├── PresetManager.jsx          ← Timer presets
│   │   └── SessionEndModal.jsx        ← Session complete
│   ├── Shared/
│   │   └── NotificationToast.jsx      ← Toast system
│   └── Dashboard/
│       └── RewardsWidget.jsx          ← Rewards display
├── contexts/
│   ├── NotificationContext.jsx        ← Toast provider
│   └── GoalTrackerContext.jsx         ← Goal state
├── pages/
│   ├── Focus/Focus.jsx                ← Enhanced timer
│   └── Goals/Goals.jsx                ← Enhanced goals
└── services/
    ├── api.js                         ← API endpoints
    └── mockApi.js                     ← Mock data
```

---

## Demo Credentials (if using backend)

```
Email: demo@example.com
Password: demo123
```

Or create new account!

---

## Support

Issues? Check:
1. Browser console (F12)
2. Network tab for API calls
3. `TESTING_CHECKLIST.md` for detailed tests
4. `MIGRATION_COMPLETE.md` for feature docs

---

**Happy Testing! 🎉**

*All features are designed to work seamlessly together. Enjoy your enhanced study session guardian!* 📚✨
