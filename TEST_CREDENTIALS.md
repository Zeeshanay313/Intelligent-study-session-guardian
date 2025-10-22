# Study Session Guardian - Test Credentials

## Valid Login Credentials for Testing

The authentication system has been enhanced with proper validation. Use these valid credentials to test the login functionality:

### Test Account 1 - Developer
- **Email:** `dev@test.com`
- **Password:** `password123`
- **User:** Dev User

### Test Account 2 - Student
- **Email:** `student@study.com`
- **Password:** `study2024`
- **User:** Study Student

### Test Account 3 - General
- **Email:** `test@example.com`
- **Password:** `test123`
- **User:** Test User

## Invalid Credentials

Any other email/password combination will show:
❌ "Invalid credentials. Please check your email and password."

## Comprehensive Study Session Features

When you click "Start Comprehensive Study Session", the system will:

1. **Collect data from all 4 modules:**
   - 📊 Profile Settings (user preferences, privacy settings)
   - ⏰ Focus Timer (presets, stats, configurations)
   - 🔔 Reminders (active reminders, notification settings)
   - 🎯 Goals Tracker (active goals, progress, achievements)

2. **Save comprehensive session data** including:
   - User profile and preferences
   - Timer statistics and preferences
   - Active reminders and notification settings
   - Current goals and progress data
   - Session metadata and timestamps

3. **Start the actual study session** with all collected context

## Data Collection Process

The system performs the following steps when starting a session:
1. Collects data from Profile Settings module
2. Gathers Focus Timer presets and statistics
3. Retrieves active Reminders and settings
4. Fetches Goals data and progress
5. Compiles comprehensive session data
6. Saves all data to database/localStorage
7. Starts the actual timer session
8. Displays data collection summary

This ensures every study session has complete context from all your modules for better tracking and analytics.