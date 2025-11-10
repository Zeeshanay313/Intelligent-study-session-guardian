# Intelligent Study Session Guardian

A modern, full-stack MERN application designed to help students manage their study sessions, track progress, and maintain focused learning habits. Features a completely modernized UI with professional design, dark/light theme support, and comprehensive study management tools.

## ✨ Recent Updates
- 🎨 **Completely Modernized UI** - Professional dashboard with heroicons, modern metrics cards, and charts
- 🌙 **Dark/Light Theme Toggle** - Automatic system detection with manual override
- 📱 **Responsive Design** - Mobile-first approach with enhanced component library
- 🎯 **Focus Timer** - Built-in Pomodoro timer with progress indicators and customizable settings
- 👤 **Enhanced Profile Management** - Complete user profile system with real-time updates
- 🚀 **Production Ready** - Clean, professional interface suitable for deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 7.0+
- Git

### One-Line Setup
```bash
# Clone, install dependencies, setup environment, and start development servers
git clone <repo-url> study-guardian && cd study-guardian && cp backend/.env.example backend/.env && cp frontend/.env.example frontend/.env && cd backend && npm install && cd ../frontend && npm install && cd ../backend && npm run seed && npm run dev & cd ../frontend && npm start
```

### Manual Setup

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run seed  # Create admin and test users
npm run dev   # Start development server on port 5000
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed
npm start     # Start development server on port 3000
```

#### Docker Setup
```bash
cd backend
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Features Implemented

### 🔐 Authentication & Security
- JWT + Refresh tokens in HttpOnly cookies
- bcrypt password hashing (12 rounds)
- Rate limiting (auth: 5/15min, API: 100/15min)
- Helmet.js security headers
- Input validation with express-validator
- CSRF protection via SameSite cookies
- Secure session management

### 👤 Profile Management
- Editable display name, timezone, preferences
- Theme selector (light/dark/system)
- Font size control (small/medium/large)
- Avatar upload with 2MB limit
- Profile data validation

### 🛡️ Privacy Controls
- **Camera consent toggle** (OFF by default)
- **Guardian sharing opt-in** (OFF by default)
- Selective field sharing controls
- Notification preferences (in-app, email)
- Privacy-first design principles

### 📱 Device Management
- Device registration with fingerprinting
- Access control per device
- Permission management (camera, mic, notifications)
- Trust scoring system
- Suspicious activity detection

### 📊 Audit & Compliance
- Complete audit trail for privacy actions
- Data export (JSON format)
- Soft delete with 30-day retention
- GDPR-compliant data handling
- Privacy impact scoring

### 🎯 Goal Tracker
- **Weekly/monthly goals** with hours, sessions, and task targets
- **Progress tracking** with visual progress bars and percentage completion
- **Milestones and sub-tasks** with due dates and completion status
- **History and achievement notifications** for completed goals and milestones
- **Alerts and catch-up suggestions** when goals fall behind schedule
- **Privacy-aware sharing** with optional guardian/teacher visibility (respects user privacy settings)
- **Goal filtering and sorting** by type, completion status, and due dates
- **Atomic progress updates** with race condition protection
- **Real-time progress visualization** with color-coded indicators

### 🔄 Data Management
- User data export functionality
- Account deletion workflow
- Restore deleted accounts (within retention period)
- Guardian invitation system

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── services/        # Business logic
│   └── config/          # Database, auth configuration
├── tests/               # Jest + Supertest tests
└── scripts/             # Seed data, cleanup
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API layer
│   ├── contexts/        # React Context providers
│   └── styles/          # Global CSS + Tailwind
└── tests/               # React Testing Library tests
```

## 🔒 Security Features

### Backend Security Checklist
- ✅ Secure JWT implementation with rotation
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ MongoDB injection prevention
- ✅ File upload restrictions
- ✅ Audit logging for privacy actions
- ✅ Environment variable protection

### Privacy Implementation
- ✅ Camera access OFF by default
- ✅ Explicit consent for guardian sharing
- ✅ Granular sharing controls
- ✅ Data minimization principles
- ✅ Right to be forgotten (soft delete)
- ✅ Data portability (export)
- ✅ Consent withdrawal mechanisms
- ✅ Privacy impact assessments

## 📡 API Endpoints

### Authentication
```bash
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
POST /api/auth/refresh      # Token refresh
GET  /api/auth/me          # Get current user
PATCH /api/auth/change-password # Change password
```

### User Profile & Privacy
```bash
GET   /api/users/me                    # Get profile
PATCH /api/users/me/profile           # Update profile
PATCH /api/users/me/privacy           # Update privacy settings
POST  /api/users/me/avatar            # Upload avatar
POST  /api/users/me/export            # Export user data
DELETE /api/users/me                  # Delete account
POST  /api/users/me/guardian-invite   # Invite guardian
GET   /api/users/:id/audit-logs       # Get audit logs
```

### Device Management
```bash
POST   /api/devices/register          # Register device
GET    /api/devices/my-devices        # Get user devices
PATCH  /api/devices/:id/access        # Update device access
POST   /api/devices/:id/revoke        # Revoke device access
DELETE /api/devices/:id               # Remove device
```

### Goal Tracker
```bash
GET    /api/goals                     # Get all goals (with filtering)
GET    /api/goals/:id                 # Get specific goal by ID
POST   /api/goals                     # Create new goal
PUT    /api/goals/:id                 # Update existing goal
DELETE /api/goals/:id                 # Delete goal (soft delete)
POST   /api/goals/:id/progress        # Update goal progress atomically
POST   /api/goals/:id/milestones/:milestoneId/toggle # Toggle milestone completion
```

#### Goal API Query Parameters
```bash
GET /api/goals?targetType=hours&completed=false&limit=10&skip=0
GET /api/goals?userId=<userId>  # Access other user's goals (requires permission)
```

## 🧪 Sample API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "displayName": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Update Privacy Settings
```bash
curl -X PATCH http://localhost:5000/api/users/me/privacy \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "cameraConsent": true,
    "guardianSharing": false,
    "shareFields": ["progress"],
    "notifications": {
      "email": true,
      "inApp": true
    }
  }'
```

### Export User Data
```bash
curl -X POST http://localhost:5000/api/users/me/export \
  -b cookies.txt \
  -o user-data-export.json
```

### Device Registration
```bash
curl -X POST http://localhost:5000/api/devices/register \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "deviceId": "device_12345",
    "deviceInfo": {
      "name": "Chrome on Windows",
      "type": "desktop",
      "os": "Windows",
      "browser": "Chrome"
    }
  }'
```

### Goal Tracker Examples

#### Create Goal with Milestones
```bash
curl -X POST http://localhost:5000/api/goals \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Learn Advanced React",
    "description": "Master advanced React concepts including hooks, context, and performance optimization",
    "targetType": "hours",
    "targetValue": 100,
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "visibility": "shared",
    "milestones": [
      {
        "title": "Complete Hooks Tutorial",
        "dueDate": "2024-02-15"
      },
      {
        "title": "Build Context API Project",
        "dueDate": "2024-04-15"
      }
    ]
  }'
```

#### Update Goal Progress
```bash
curl -X POST http://localhost:5000/api/goals/:goalId/progress \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"amount": 5}'
```

#### Get Goals with Filtering
```bash
# Get all hours-based goals
curl -X GET "http://localhost:5000/api/goals?targetType=hours" \
  -b cookies.txt

# Get completed goals only
curl -X GET "http://localhost:5000/api/goals?completed=true" \
  -b cookies.txt

# Get goals with pagination
curl -X GET "http://localhost:5000/api/goals?limit=10&skip=0" \
  -b cookies.txt
```

#### Toggle Milestone Completion
```bash
curl -X POST http://localhost:5000/api/goals/:goalId/milestones/:milestoneId/toggle \
  -b cookies.txt
```

## 🗄️ Database Schema

### User Collection
```javascript
{
  email: String (unique, required),
  password: String (hashed),
  profile: {
    displayName: String,
    avatar: String,
    timezone: String,
    preferences: {
      theme: "light" | "dark" | "system",
      fontSize: "small" | "medium" | "large",
      language: String
    }
  },
  privacy: {
    cameraConsent: Boolean (default: false),
    guardianSharing: Boolean (default: false),
    shareFields: [String],
    notifications: {
      inApp: Boolean,
      email: Boolean,
      studyReminders: Boolean,
      guardianUpdates: Boolean
    }
  },
  deleted: Boolean (default: false),
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### AuditLog Collection
```javascript
{
  userId: ObjectId,
  action: String, // PRIVACY_UPDATED, CAMERA_CONSENT_CHANGED, etc.
  details: Object,
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceId: String
  },
  privacyImpact: "none" | "low" | "medium" | "high",
  dataCategories: [String],
  timestamp: Date
}
```

### DeviceAccess Collection
```javascript
{
  userId: ObjectId,
  deviceId: String,
  deviceInfo: {
    name: String,
    type: "desktop" | "mobile" | "tablet",
    os: String,
    browser: String
  },
  accessEnabled: Boolean,
  permissions: {
    camera: Boolean,
    microphone: Boolean,
    notifications: Boolean,
    location: Boolean
  },
  trustScore: Number (0-100),
  lastSeen: Date,
  createdAt: Date
}
```

### Goal Collection
```javascript
{
  userId: ObjectId (ref: User, required),
  title: String (required, max: 200),
  description: String (max: 1000),
  targetType: "hours" | "sessions" | "tasks" (required),
  targetValue: Number (required, min: 1, max: 10000),
  progressValue: Number (default: 0, min: 0),
  milestones: [{
    title: String (required, max: 200),
    done: Boolean (default: false),
    dueDate: Date (required)
  }],
  startDate: Date (required),
  endDate: Date (required, must be after startDate),
  visibility: "private" | "shared" | "public" (default: "private"),
  isActive: Boolean (default: true),
  completedAt: Date (null if not completed),
  createdAt: Date,
  updatedAt: Date,
  
  // Virtual fields
  progressPercentage: Number (calculated),
  isCompleted: Boolean (calculated),
  daysRemaining: Number (calculated),
  milestoneProgress: Number (calculated)
}
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Run with coverage report
npm run test:goals    # Run Goal Tracker tests specifically
```

### Frontend Tests
```bash
cd frontend
npm test              # Run React tests
npm run test:coverage # Run with coverage
npm test -- --testPathPattern=GoalTracker  # Run Goal Tracker tests
```

### Goal Tracker Test Coverage
- **Backend**: CRUD operations, privacy enforcement, atomic updates, milestone management
- **Frontend**: Component rendering, user interactions, API integration, error handling
- **Integration**: End-to-end goal creation, progress tracking, milestone completion workflows

### Test Accounts
After running `npm run seed`:
- **Admin**: admin@studyguardian.com / AdminPass123!
- **Test User**: testuser@example.com / TestPass123! (with sample goals)
- **Student**: student@example.com / StudentPass123!

### Goal Tracker Seeding
```bash
cd backend
npm run seed:goals    # Seed sample goals for testing
node src/seeds/seedGoals.js  # Direct seeding script
```

### Sample Goals Created
- **Mathematics Course** (120 hours target, 4 milestones)
- **Daily Study Sessions** (100 sessions target, monthly milestones)  
- **Research Paper Tasks** (25 tasks target, 6 research milestones)
- **Language Learning** (50 hours target, vocabulary & grammar milestones)
- **Programming Challenges** (52 tasks target, quarterly milestones)
- **Physical Fitness** (150 sessions target, strength & endurance phases)

## 🚀 Deployment

### Production Environment Variables
```bash
NODE_ENV=production
JWT_SECRET=<strong-secret-key>
JWT_REFRESH_SECRET=<another-strong-secret>
MONGODB_URI=<production-mongodb-uri>
CLIENT_URL=<production-frontend-url>
```

### Docker Production
```bash
docker build -t study-guardian-backend .
docker run -p 5000:5000 --env-file .env study-guardian-backend
```

## 📈 Monitoring & Maintenance

### Cleanup Tasks
```bash
npm run cleanup  # Remove expired users, devices, logs
```

### Health Check
```bash
curl http://localhost:5000/health
```

## 🧰 Development Tools

### Postman Collection
Import the Goal Tracker API collection for testing:
```bash
# Located at: tools/postman/GoalTracker.postman_collection.json
# Features:
# - Complete API endpoint coverage
# - Example requests with sample data
# - Automatic token management
# - Response validation tests
# - Workflow examples for common use cases
```

### Frontend Routes
```bash
/goals              # Goal list and management
/goals/new          # Create new goal
/goals/:id          # Goal detail view
/goals/:id/edit     # Edit existing goal
/profile            # User profile with privacy settings
```

### Goal Tracker Components
```bash
frontend/src/modules/GoalTracker/
├── components/
│   ├── GoalList.jsx     # Goal overview with filtering and quick actions
│   ├── GoalForm.jsx     # Create/edit goal form with milestone management
│   └── GoalDetail.jsx   # Detailed goal view with progress controls
├── api/
│   └── goalApi.js       # API client for goal operations
├── goalTrackerContext.js # React Context for state management
└── tests/               # Comprehensive component tests
```

## 🤝 Development

### Code Style
- ESLint configuration included
- Prettier for code formatting
- Conventional commits recommended

### Contributing
1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```bash
   # Check MongoDB is running
   mongosh --eval "db.adminCommand('ping')"
   ```

2. **JWT Token Issues**
   ```bash
   # Clear cookies and re-login
   curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt
   ```

3. **CORS Errors**
   - Ensure CLIENT_URL in backend .env matches frontend URL
   - Check withCredentials is set to true in API calls

4. **File Upload Issues**
   - Check MAX_FILE_SIZE environment variable
   - Ensure uploads directory exists and is writable

### Support
For issues and questions, please create an issue in the repository.

---

**Security Note**: This implementation follows security best practices for a student project. For production use, consider additional security measures like Web Application Firewall, DDoS protection, and professional security audit.