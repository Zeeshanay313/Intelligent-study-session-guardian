# 🧪 Testing Checklist - New Features

## Prerequisites
- [ ] Backend running on `http://localhost:5004`
- [ ] Frontend running on `http://localhost:3000` (Vite dev server)
- [ ] Browser console open (F12) to check for errors
- [ ] Dark mode toggle tested before starting

---

## 1. Google OAuth Authentication 🔐

### Test Scenarios
- [ ] Click "Sign in with Google" on Login page
- [ ] Verify redirect to backend OAuth route
- [ ] Complete Google OAuth flow
- [ ] Verify redirect back with token
- [ ] Check user is logged in
- [ ] Test "Sign up with Google" on Register page
- [ ] Try signup with existing email (should show error)
- [ ] Verify error message display on Login page
- [ ] Check URL parameters are cleaned after processing
- [ ] Verify form clears on page unmount

**Expected Results:**
- ✅ Smooth redirect flow
- ✅ Proper error messages
- ✅ Clean URLs after redirect
- ✅ User logged in successfully

---

## 2. Timer Presets 🎯

### Test Scenarios
- [ ] Navigate to Focus page
- [ ] Click "Layers" icon in header
- [ ] Verify PresetManager modal opens
- [ ] Create new preset:
  - [ ] Enter name (e.g., "Deep Work")
  - [ ] Select color (try different colors)
  - [ ] Select icon (try different emojis)
  - [ ] Set work duration (e.g., 45 minutes)
  - [ ] Set break duration (e.g., 10 minutes)
  - [ ] Set long break duration (e.g., 20 minutes)
  - [ ] Set cycles before long break (e.g., 4)
  - [ ] Click "Create Preset"
- [ ] Verify preset appears in list
- [ ] Edit existing preset:
  - [ ] Click edit button
  - [ ] Change values
  - [ ] Save changes
- [ ] Delete preset (with confirmation)
- [ ] Close modal and check quick presets grid appears
- [ ] Click a preset to apply it
- [ ] Verify timer updates with preset values

**Expected Results:**
- ✅ All CRUD operations work
- ✅ Colors and icons display correctly
- ✅ Presets persist after page reload
- ✅ Quick presets grid shows last 6 presets
- ✅ Apply preset updates timer

---

## 3. Session End Modal 🎉

### Test Scenarios
- [ ] Start a timer session (can use 1 minute for testing)
- [ ] Let timer complete (or wait)
- [ ] Verify SessionEndModal appears automatically
- [ ] Check session summary displays:
  - [ ] Duration shown correctly
  - [ ] Preset name displayed
  - [ ] Today's session count
  - [ ] Streak (if available)
- [ ] Verify audio plays (Web Audio API sound)
- [ ] Check break suggestion displays:
  - [ ] Suggestion time shown
  - [ ] Confidence badge (high/medium/low)
  - [ ] Reason message
- [ ] Click "Start X Min Break" button
- [ ] Verify timer switches to break mode
- [ ] Click "Start Another Session"
- [ ] Click "Close" to dismiss modal

**Expected Results:**
- ✅ Modal appears on session complete
- ✅ Audio plays (beep sound)
- ✅ All data displays correctly
- ✅ Break suggestion logic works
- ✅ Actions work as expected

---

## 4. Notification Toasts 🔔

### Test Scenarios

#### Success Notifications
- [ ] Create a new goal → Check for green success toast
- [ ] Update goal progress → Check for success toast
- [ ] Complete a timer session → Check for success toast

#### Error Notifications
- [ ] Try invalid form submission → Check for red error toast
- [ ] Simulate API failure (disconnect backend) → Check for error toast

#### Warning Notifications
- [ ] Check for any warning scenarios

#### Info Notifications
- [ ] Stop a running timer → Check for info toast
- [ ] Apply a preset → Check for blue info toast

#### Reminder Notifications
- [ ] (If implemented) Break reminders

#### Toast Features
- [ ] Verify auto-dismiss after 4 seconds (6s for errors)
- [ ] Check "Dismiss all" button appears with 2+ toasts
- [ ] Click individual X button to dismiss
- [ ] Click "Dismiss all" to clear all toasts
- [ ] Verify slide-in animation
- [ ] Test in dark mode

**Expected Results:**
- ✅ All 5 toast types display with correct colors
- ✅ Icons match toast type
- ✅ Auto-dismiss works
- ✅ Manual dismiss works
- ✅ Animations smooth

---

## 5. Goals - Quick Progress Buttons 📊

### Test Scenarios
- [ ] Navigate to Goals page
- [ ] Create a test goal (e.g., "Study 100 hours")
- [ ] Click "+1" button
  - [ ] Verify progress increases by 1
  - [ ] Check success toast appears
  - [ ] Verify progress bar updates
- [ ] Click "+5" button
  - [ ] Verify progress increases by 5
  - [ ] Check success toast
- [ ] Click "Custom" button
  - [ ] Enter custom value (e.g., 10)
  - [ ] Verify progress updates correctly
- [ ] Try quick progress multiple times
- [ ] Check progress doesn't exceed target value

**Expected Results:**
- ✅ All 3 buttons work correctly
- ✅ Progress updates immediately
- ✅ Toasts show on each update
- ✅ Progress bar animates smoothly
- ✅ Can't exceed target value

---

## 6. Goals - Milestone Tracking 🏆

### Test Scenarios
- [ ] Create/edit a goal with milestones
- [ ] Add milestone via API/mock (not in UI yet, but data structure ready)
- [ ] View goal with milestones
- [ ] Check milestone counter shows (e.g., "Milestones (2/5)")
- [ ] Click to expand milestones
  - [ ] Verify collapse/expand animation
  - [ ] Check all milestones listed
- [ ] Check milestone completion status:
  - [ ] Completed: green checkmark, strikethrough text
  - [ ] Incomplete: gray checkmark, normal text
- [ ] Check target progress display (e.g., "at 50 hours")
- [ ] Collapse milestones section

**Expected Results:**
- ✅ Milestones expand/collapse smoothly
- ✅ Counter accurate
- ✅ Completion status visual
- ✅ Target progress shown

---

## 7. Goals - Due Date Warnings ⚠️

### Test Scenarios
- [ ] Create goal with deadline in 3 days
  - [ ] Check "3 days left" in orange color
- [ ] Create goal with deadline in 10 days
  - [ ] Check "10 days left" in normal color
- [ ] Create goal with past deadline
  - [ ] Check "Overdue" badge with warning icon
  - [ ] Verify red/orange warning color
- [ ] Check goals list for visual indicators

**Expected Results:**
- ✅ Days remaining calculated correctly
- ✅ <7 days shows orange warning
- ✅ Overdue shows red alert badge
- ✅ Icons display properly

---

## 8. Rewards Widget 🏅

### Test Scenarios
- [ ] Navigate to Dashboard page
- [ ] Verify RewardsWidget displays (if added to Dashboard)
- [ ] Check widget shows:
  - [ ] Current level (e.g., "Level 5")
  - [ ] Total points
  - [ ] Progress to next level (bar + fraction)
  - [ ] Badges earned count
  - [ ] Last 5 badge icons
  - [ ] "+X more" if >5 badges
  - [ ] Next badge preview with icon, name, requirement
- [ ] Click widget
  - [ ] Verify navigates to full Rewards page
- [ ] Check gradient background (purple to blue)
- [ ] Test in dark mode

**Expected Results:**
- ✅ All data displays correctly
- ✅ Progress bar accurate
- ✅ Badge icons show properly
- ✅ Click-through works
- ✅ Gradient looks good
- ✅ Dark mode support

---

## 9. Focus Page - Preset Integration ⚡

### Test Scenarios
- [ ] Navigate to Focus page
- [ ] Check quick presets grid displays (if presets exist)
- [ ] Verify 6 presets shown maximum
- [ ] Click a preset tile:
  - [ ] Check border highlights (active preset)
  - [ ] Verify timer duration updates
  - [ ] Check success toast appears
- [ ] Start timer with preset
- [ ] Try clicking another preset while running
  - [ ] Should be disabled (opacity reduced, no cursor)
- [ ] Complete session
  - [ ] Check SessionEndModal shows preset name
- [ ] Click "Layers" icon to manage presets

**Expected Results:**
- ✅ Presets grid responsive (2-3 columns)
- ✅ Apply preset updates timer
- ✅ Disabled during running session
- ✅ Visual feedback on active preset
- ✅ Integration seamless

---

## 10. Dark Mode Consistency 🌙

### Test All Components in Dark Mode
- [ ] Toggle dark mode switch
- [ ] PresetManager modal
  - [ ] Background dark
  - [ ] Text readable
  - [ ] Buttons styled correctly
- [ ] SessionEndModal
  - [ ] Gradient header looks good
  - [ ] Stats section readable
  - [ ] Break suggestion box styled
- [ ] NotificationToasts
  - [ ] All 5 types visible
  - [ ] Dark variants applied
  - [ ] Icons visible
- [ ] Goals page
  - [ ] Cards dark background
  - [ ] Progress bars visible
  - [ ] Quick progress buttons styled
  - [ ] Milestones readable
- [ ] Focus page
  - [ ] Timer display clear
  - [ ] Preset tiles styled
  - [ ] Settings panel readable
- [ ] RewardsWidget
  - [ ] Gradient adapts
  - [ ] Text readable
  - [ ] Badges visible

**Expected Results:**
- ✅ All components have dark mode styles
- ✅ No white flashes or glitches
- ✅ Text always readable (proper contrast)
- ✅ Colors adapt appropriately

---

## 11. Mobile Responsiveness 📱

### Test on Mobile View (DevTools)
- [ ] Resize browser to 375px width
- [ ] PresetManager modal fits screen
- [ ] SessionEndModal scrollable
- [ ] NotificationToast not too wide
- [ ] Goals page cards stack properly
- [ ] Quick progress buttons responsive
- [ ] Focus timer display scales
- [ ] Preset grid 2 columns on mobile
- [ ] Navigation menu accessible

**Expected Results:**
- ✅ All components responsive
- ✅ No horizontal scroll
- ✅ Touch targets adequate size
- ✅ Text readable at small sizes

---

## 12. Performance & Console 🚀

### Check for Issues
- [ ] Open browser console (F12)
- [ ] Navigate between pages
- [ ] Check for:
  - [ ] No console errors (red text)
  - [ ] No console warnings (yellow text)
  - [ ] No failed network requests
  - [ ] Proper API fallback to mock data
- [ ] Test localStorage:
  - [ ] Create preset → reload page → preset persists
  - [ ] Check Application tab → Local Storage
- [ ] Check animations smooth (no lag)
- [ ] Verify no memory leaks (long usage)

**Expected Results:**
- ✅ Clean console (no errors)
- ✅ All API calls succeed or gracefully fallback
- ✅ localStorage working
- ✅ Smooth performance

---

## 13. Integration Test - Full Workflow 🔄

### Complete User Journey
1. [ ] Login with Google OAuth
2. [ ] Navigate to Focus page
3. [ ] Create a new timer preset
4. [ ] Apply preset and start session
5. [ ] Complete session (or wait)
6. [ ] SessionEndModal appears
7. [ ] Accept break suggestion
8. [ ] Break timer starts
9. [ ] Navigate to Goals page
10. [ ] Create a new goal
11. [ ] Use quick progress buttons (+1, +5, custom)
12. [ ] Check milestone section
13. [ ] Navigate to Dashboard
14. [ ] Check RewardsWidget displays
15. [ ] Click widget → go to Rewards page
16. [ ] Toggle dark mode
17. [ ] Repeat some actions
18. [ ] Logout
19. [ ] Login again
20. [ ] Verify data persists

**Expected Results:**
- ✅ Complete flow works without errors
- ✅ Data persists across navigation
- ✅ All integrations seamless
- ✅ No crashes or freezes

---

## 🐛 Bug Tracking

### Issues Found
| Component | Issue | Severity | Status |
|-----------|-------|----------|--------|
| Example | Button not clickable | High | Fixed |
| | | | |

---

## ✅ Final Checklist

- [ ] All features tested and working
- [ ] No console errors
- [ ] Dark mode fully supported
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Data persistence works
- [ ] OAuth flow complete
- [ ] Ready to delete old frontend

---

## 📝 Notes

Add any observations, edge cases, or improvements here:

```
Example:
- Session end audio might be loud, consider volume control
- Custom progress input could use better validation
- Milestone add UI could be added to Goals form
```

---

**Once all tests pass, you're ready to delete the old `frontend/` directory! 🎉**
