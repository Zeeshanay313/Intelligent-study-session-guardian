# Focus Timer Enhanced Features - Setup Guide

## ✅ Features Implemented

1. **Custom Presets** - Create, edit, and delete timer presets
2. **Automatic Session Logging** - All completed sessions are saved with timestamps
3. **Audio/Visual Alerts** - Session completion notifications
4. **Intelligent Break Suggestions** - Smart break duration recommendations based on your session history

## 🔍 Troubleshooting Checklist

### Step 1: Verify Backend is Running
The backend server must be running on port 5004.

**Check if running:**
```powershell
# In PowerShell terminal
netstat -ano | findstr :5004
```

**If not running, start it:**
```powershell
cd backend
npm start
```

You should see:
```
✅ SERVER RUNNING SUCCESSFULLY!
🌐 Port: 5004
💾 MongoDB: Connected
```

### Step 2: Restart Frontend
The frontend must be restarted to load the new components.

**Stop the current frontend (Ctrl+C), then:**
```powershell
cd frontend
npm start
```

**Or for a hard refresh:**
```powershell
cd frontend
rm -r -fo node_modules/.cache  # Clear cache
npm start
```

### Step 3: Verify You're Logged In
The new features require authentication. Make sure you're logged in:

1. Navigate to http://localhost:3000/login
2. Log in with your credentials
3. Navigate to the Focus Timer page

### Step 4: Test the Features

#### Test Preset Dropdown:
1. Go to Focus Timer page
2. You should see a dropdown at the top that says "Select Preset" or shows preset names
3. Click the dropdown
4. Click "+ Add Custom Preset"
5. Fill in the form:
   - Name: "Deep Work"
   - Work Duration: 45 minutes
   - Break Duration: 10 minutes
6. Click "Save Preset"
7. The dropdown should now show "Deep Work"

#### Test Session Logging:
1. Select a preset or set custom duration
2. Click "Start" button
3. Let the timer run (or wait at least 10 seconds)
4. Click "Stop" or let it complete
5. You should see a modal appear showing:
   - "Session Complete!"
   - Today's session count
   - Break suggestion

#### Test Audio/Visual Alerts:
1. Start a timer
2. Let it complete fully (all time runs out)
3. You should hear a notification sound (if audio enabled)
4. A modal should pop up (visual notification)

## 🐛 Common Issues & Solutions

### Issue: "Cannot GET /api/presets" or 404 errors
**Solution:** Backend server is not running or not accessible
```powershell
# Restart backend
cd backend
npm start
```

### Issue: Preset dropdown is empty or shows "Loading presets..."
**Possible causes:**
1. Not logged in - Go to /login
2. Backend not connected - Check network tab in browser DevTools (F12)
3. CORS issue - Backend should show the request

**Debug:**
Open browser console (F12) and check for errors:
```javascript
// Should see in console:
🔧 API Configuration:
BASE_URL: http://localhost:5004
✅ Backend is available
```

### Issue: "Loading presets..." never completes
**Solution:** Check browser console for authentication errors
```javascript
// If you see 401 Unauthorized:
// 1. Clear cookies
// 2. Log out and log back in
// 3. Check if token is in cookies (DevTools > Application > Cookies)
```

### Issue: Modal doesn't appear after session completes
**Check:**
1. Open browser console - any JavaScript errors?
2. Verify `SessionEndModal` component exists:
```powershell
ls frontend/src/components/timer/SessionEndModal.jsx
```

### Issue: Preset saves but doesn't appear in dropdown
**Debug steps:**
1. Open browser DevTools (F12)
2. Go to Application tab > Local Storage
3. Check `focus_timer_presets` key - should contain your presets
4. If empty, check Network tab for failed API calls

## 📁 File Locations

All new files are in these locations:

**Backend:**
- `backend/src/models/Preset.js` - Database model
- `backend/src/models/SessionLog.js` - Session tracking
- `backend/src/controllers/presetsController.js` - Preset CRUD
- `backend/src/controllers/sessionsController.js` - Session logging
- `backend/src/services/suggestionService.js` - Break suggestions
- `backend/src/routes/presets.js` - API routes
- `backend/src/routes/sessions.js` - API routes

**Frontend:**
- `frontend/src/components/FocusTimer.jsx` - Main timer (UPDATED)
- `frontend/src/components/timer/PresetDropdown.jsx` - Preset selector
- `frontend/src/components/timer/SessionEndModal.jsx` - Completion modal
- `frontend/src/hooks/useFocusTimer.js` - Enhanced timer hook
- `frontend/src/services/presetsApi.js` - Preset API client
- `frontend/src/services/sessionsApi.js` - Session API client

## 🧪 Quick Test Script

Run this in your browser console (F12) when on the Focus Timer page:

```javascript
// Test 1: Check if enhanced hook is loaded
console.log('Hook loaded:', typeof useFocusTimer);

// Test 2: Check localStorage for presets
console.log('Cached presets:', localStorage.getItem('focus_timer_presets'));

// Test 3: Test API connection
fetch('http://localhost:5004/api/presets', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => console.log('Presets from API:', data))
  .catch(err => console.error('API Error:', err));
```

## ✨ Expected Behavior

**When working correctly:**

1. **Page Load:**
   - Preset dropdown appears at top of timer
   - Shows "Select Preset" or lists your saved presets
   - Can create new preset via "+ Add Custom Preset"

2. **During Session:**
   - Timer counts down normally
   - Pause/Resume/Stop buttons work
   - Preset name shows in timer if selected

3. **Session Complete:**
   - Audio plays (if enabled)
   - Modal pops up showing:
     - Success message
     - Sessions completed today
     - Intelligent break suggestion
   - Accept/Dismiss buttons work

4. **Presets:**
   - Can create new presets
   - Can edit existing presets (pencil icon)
   - Can delete presets (trash icon)
   - Default preset has star icon

## 🔗 API Endpoints

Test these directly to verify backend:

```bash
# Get all presets
curl http://localhost:5004/api/presets -H "Cookie: accessToken=YOUR_TOKEN"

# Create preset
curl -X POST http://localhost:5004/api/presets \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"name":"Test","workDuration":25,"breakDuration":5}'

# Complete session
curl -X POST http://localhost:5004/api/sessions/complete \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"durationSeconds":300,"startedAt":"2025-11-10T10:00:00Z","endedAt":"2025-11-10T10:05:00Z"}'

# Get break suggestion
curl http://localhost:5004/api/sessions/suggestion -H "Cookie: accessToken=YOUR_TOKEN"
```

## 📞 Still Having Issues?

1. **Check browser console** (F12) for errors
2. **Check backend logs** in the terminal where backend is running
3. **Verify all files exist** using the file locations above
4. **Clear browser cache** and hard reload (Ctrl+Shift+R)
5. **Try incognito mode** to rule out extension conflicts

## 🎯 Success Indicators

You know it's working when:
- ✅ Preset dropdown shows at top of timer
- ✅ Can create and save presets
- ✅ Presets persist after page refresh
- ✅ Modal appears when session completes
- ✅ Break suggestions change based on your session history
- ✅ Session count increments with each completion
