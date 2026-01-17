# 🎓 Intelligent Study Session Guardian

> **A modern, full-stack application to supercharge your study sessions with AI-powered insights, smart timers, goal tracking, and gamification!**

[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features Overview

### 🎯 **Smart Focus Timer**
- **Pomodoro Technique** - Scientifically proven time management
- **Custom Presets** - Save your favorite timer configurations
  - 8 color themes and 10 icon options
  - Work/break/long break durations
  - Cycles before long break
  - localStorage backup
- **Session End Modal** - Celebrate completions with:
  - Audio notifications
  - AI-powered break suggestions
  - Streak tracking
  - Session statistics
- **Keyboard Shortcuts** - Space to start/pause, Esc to stop

### 📊 **Advanced Goal Tracking**
- **SMART Goals** - Set specific, measurable, achievable targets
- **Quick Progress Updates** - +1, +5, or custom increment buttons
- **Milestone Tracking** - Break goals into smaller achievements
  - Expandable/collapsible sections
  - Completion checkmarks
  - Target progress indicators
- **Due Date Warnings** - Visual alerts for approaching deadlines
  - Orange highlight for <7 days
  - Red overdue badges
  - Days remaining countdown
- **Progress History** - Track your journey over time
- **Privacy Controls** - Manage goal visibility

### 🏆 **Gamification & Rewards**
- **Level System** - Earn XP and level up
- **Badges & Achievements** - 50+ unique badges to collect
- **Rewards Widget** - Compact dashboard display
  - Current level and points
  - Progress to next level
  - Last 5 badges earned
  - Next badge preview
- **Leaderboards** - Compare with peers (optional)

### 🔔 **Smart Notifications**
- **5 Notification Types**:
  - ✅ Success (green)
  - ❌ Error (red)
  - ⚠️ Warning (yellow)
  - ℹ️ Info (blue)
  - 🔔 Reminder (purple)
- **Auto-Dismiss** - Configurable timeout
- **Dismiss All** - Clear multiple notifications
- **Smooth Animations** - Slide-in effects
- **Action Buttons** - Interactive notifications

### 🔐 **Authentication**
- **Email/Password** - Traditional authentication
- **Google OAuth** - One-click sign-in
- **Password Recovery** - Secure reset flow
- **JWT Tokens** - Secure session management
- **Remember Me** - Persistent sessions

### 📈 **Analytics & Reports**
- **Study Time Tracking** - Detailed session logs
- **Productivity Charts** - Visual progress over time
- **Goal Completion Rates** - Success metrics
- **Focus Patterns** - Best study times
- **Weekly/Monthly Reports** - Comprehensive insights

### 🎨 **Modern UI/UX**
- **Dark/Light Theme** - Automatic system detection + manual toggle
- **Fully Responsive** - Mobile, tablet, desktop optimized
- **Smooth Animations** - 60fps transitions
- **Accessible** - ARIA labels, keyboard navigation
- **Professional Design** - Modern, clean interface

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
npm or yarn
MongoDB 7.0+
Git
```

### Installation

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/intelligent-study-session-guardian.git
cd intelligent-study-session-guardian
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm run seed  # ⭐ IMPORTANT: Seeds badges, challenges, and tips
npm start     # Start on http://localhost:5004
```

> **🎯 New Device Setup:** If you clone this repo on a new device, make sure to run `npm run seed` to populate your database with motivation features, challenges, and badges!

3. **Setup Frontend (Vite)**
```bash
cd frontend-vite
npm install
cp .env.example .env
# Edit .env if needed (VITE_API_URL)
npm run dev   # Start on http://localhost:3000
```

4. **Open Browser**
```
http://localhost:3000
```

### Demo Credentials
```
Email: demo@example.com
Password: demo123
```

---

## 📦 Tech Stack

### Frontend
- **React 18** - UI library
- **Vite 5** - Build tool & dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS 3.4** - Utility-first styling
- **Lucide React** - Icon library
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js 18+** - Runtime
- **Express 4** - Web framework
- **MongoDB 7** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Passport** - OAuth strategies
- **Bcrypt** - Password hashing
- **Joi** - Validation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **GitHub Actions** - CI/CD (optional)

---

## 📁 Project Structure

```
intelligent-study-session-guardian/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Auth, validation, etc.
│   │   └── config/           # Configuration files
│   ├── tests/                # Backend tests
│   ├── package.json
│   └── .env.example
├── frontend-vite/             # React/Vite frontend ⭐ NEW
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Timer/       # PresetManager, SessionEndModal
│   │   │   ├── Shared/      # NotificationToast
│   │   │   ├── Dashboard/   # RewardsWidget
│   │   │   ├── UI/          # Button, Modal, Input
│   │   │   └── Layout/      # AppLayout, Navbar
│   │   ├── contexts/        # Global state
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── NotificationContext.jsx  ⭐ NEW
│   │   │   └── GoalTrackerContext.jsx   ⭐ NEW
│   │   ├── pages/           # Route components
│   │   │   ├── Landing/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── Focus/       ⭐ Enhanced
│   │   │   ├── Goals/       ⭐ Enhanced
│   │   │   ├── Rewards/
│   │   │   ├── Reports/
│   │   │   └── Settings/
│   │   ├── services/        # API clients
│   │   │   ├── api.js
│   │   │   ├── mockApi.js
│   │   │   └── socialAuthService.js  ⭐ NEW
│   │   └── styles/          # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml         # Docker setup
├── MIGRATION_COMPLETE.md      # Migration docs ⭐ NEW
├── TESTING_CHECKLIST.md       # Testing guide ⭐ NEW
├── QUICK_TEST_GUIDE.md        # Quick start ⭐ NEW
└── README.md                  # This file
```

---

## 🎮 Usage Guide

### 1. **Getting Started**
1. Register account or use demo credentials
2. Complete onboarding tutorial
3. Set your first learning goal

### 2. **Focus Timer**
1. Go to **Focus** page
2. Click **Layers icon** to manage presets
3. Create preset with your preferences
4. Apply preset and start session
5. Complete session → celebrate with modal!
6. Accept break suggestion

### 3. **Goal Management**
1. Go to **Goals** page
2. Click **"New Goal"**
3. Fill in:
   - Title (e.g., "Complete React Course")
   - Target value (e.g., 100 hours)
   - Deadline
   - Category
4. Use quick progress buttons: +1, +5, custom
5. Track milestones
6. Complete goal → earn rewards!

### 4. **Earning Rewards**
- Complete focus sessions
- Achieve goals
- Maintain study streaks
- Complete challenges
- Check **Rewards Widget** on dashboard

### 5. **Viewing Analytics**
1. Go to **Reports** page
2. View charts:
   - Study time trends
   - Goal completion rates
   - Focus patterns
3. Export reports (CSV, PDF)

---

## 🆕 What's New (Latest Migration)

### ✅ **Completed Features**

#### **PresetManager Component** 🎯
- Full CRUD for timer presets
- 8 color themes + 10 icon options
- Work/break/long break durations
- localStorage backup
- Modal-based UI

#### **SessionEndModal Component** 🎉
- Session completion celebration
- Web Audio API sound playback
- AI-powered break suggestions
- Streak tracking with flame emoji 🔥
- Session statistics display

#### **NotificationToast System** 🔔
- Global notification context
- 5 notification types with distinct styling
- Auto-dismiss with configurable duration
- Dismiss all button
- Smooth slide-in animations

#### **GoalTrackerContext** 🎯
- Comprehensive state management
- Progress tracking with history
- Milestone CRUD operations
- Privacy settings
- Statistics calculator

#### **Enhanced Goals Page** 📊
- Quick progress buttons (+1, +5, custom)
- Expandable milestone sections
- Due date warnings (<7 days orange, overdue red)
- Progress bar animations
- Notification integration

#### **Enhanced Focus Page** ⏱️
- Preset integration with quick grid
- SessionEndModal integration
- Break suggestions
- Session data tracking
- Notification toasts

#### **RewardsWidget Component** 🏆
- Compact dashboard widget
- Level & points display
- Progress bar to next level
- Last 5 badges showcase
- Next badge preview
- Click-through to full page

#### **Global Providers** 🌐
- NotificationProvider wraps entire app
- GoalTrackerProvider for goal state
- NotificationToast at root level
- Proper provider nesting

#### **Google OAuth** 🔐
- Complete OAuth flow
- Error handling (4 error types)
- URL parameter processing
- Form security
- Email pre-filling

---

## 📸 Screenshots

### Focus Timer with Presets
![Focus Timer](https://via.placeholder.com/800x450?text=Focus+Timer+with+Presets)

### Goal Tracking Dashboard
![Goals Dashboard](https://via.placeholder.com/800x450?text=Goal+Tracking+Dashboard)

### Session End Celebration
![Session End](https://via.placeholder.com/800x450?text=Session+Complete+Modal)

### Rewards & Gamification
![Rewards](https://via.placeholder.com/800x450?text=Rewards+%26+Badges)

### Dark Mode
![Dark Mode](https://via.placeholder.com/800x450?text=Beautiful+Dark+Mode)

---

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (coming soon)
cd frontend-vite
npm test
```

### Manual Testing
Follow the comprehensive testing checklist:
```bash
# See detailed testing guide
cat TESTING_CHECKLIST.md

# Quick test guide
cat QUICK_TEST_GUIDE.md
```

---

## 🚢 Deployment

### Frontend (Vite Build)
```bash
cd frontend-vite
npm run build
# Deploy 'dist' folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Your own server
```

### Backend (Node.js)
```bash
cd backend
npm start
# Deploy to:
# - Heroku
# - Railway
# - Render
# - AWS EC2
# - Digital Ocean
```

### Docker Deployment
```bash
docker-compose up -d
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Ensure dark mode support
- Test on mobile devices

---

## 📝 API Documentation

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login user
POST   /api/auth/refresh           Refresh JWT token
GET    /api/auth/google/signin     Google OAuth sign-in
GET    /api/auth/google/signup     Google OAuth sign-up
```

### Sessions
```
GET    /api/sessions               List user sessions
POST   /api/sessions/start         Start new session
PUT    /api/sessions/:id/end       End session
GET    /api/sessions/stats         Session statistics
```

### Goals
```
GET    /api/goals                  List goals
POST   /api/goals                  Create goal
GET    /api/goals/:id              Get goal details
PUT    /api/goals/:id              Update goal
DELETE /api/goals/:id              Delete goal
```

### Presets
```
GET    /api/presets                List presets
POST   /api/presets                Create preset
GET    /api/presets/:id            Get preset
PUT    /api/presets/:id            Update preset
DELETE /api/presets/:id            Delete preset
```

### Rewards
```
GET    /api/rewards                Get user rewards
GET    /api/rewards/badges         List badges
POST   /api/rewards/claim          Claim reward
```

---

## 🐛 Known Issues

- [ ] Session end audio might be loud (add volume control)
- [ ] Mobile landscape mode needs optimization
- [ ] Safari browser compatibility (minor CSS issues)

---

## 🗺️ Roadmap

### Q1 2025
- [ ] Add milestone creation UI to Goals form
- [ ] Implement social features (study groups)
- [ ] Add Spotify integration for study music
- [ ] Calendar view for scheduled sessions
- [ ] Export data to CSV/PDF

### Q2 2025
- [ ] Mobile app (React Native)
- [ ] Chrome extension for quick timers
- [ ] AI study recommendations
- [ ] Integration with Google Calendar
- [ ] Pomodoro statistics dashboard

### Q3 2025
- [ ] Study room video chat
- [ ] Collaborative goal tracking
- [ ] Custom badge creation
- [ ] Advanced analytics with ML
- [ ] API for third-party integrations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Pomodoro Technique® by Francesco Cirillo
- React team for amazing framework
- Vite team for blazing fast tooling
- Tailwind CSS for utility-first styling
- MongoDB team for flexible database
- Open source community

---

## 📞 Support

- **Documentation**: [Full Docs](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/repo/issues)
- **Email**: support@studyguardian.com
- **Discord**: [Join Community](https://discord.gg/studyguardian)

---

## ⭐ Star History

If you find this project helpful, please consider giving it a star! ⭐

---

<div align="center">

**Made with ❤️ and ☕ by developers who love learning**

[Website](https://studyguardian.com) • [Demo](https://demo.studyguardian.com) • [Docs](https://docs.studyguardian.com)

</div>
