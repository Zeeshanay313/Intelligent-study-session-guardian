# Test Suite Documentation

## Overview
Comprehensive automated testing suite for the Intelligent Study Session Guardian application, covering unit tests, integration tests, and end-to-end tests.

## Test Stack
- **Backend Unit Tests**: Jest + Supertest + MongoDB Memory Server
- **Frontend Unit Tests**: Jest + React Testing Library + @testing-library/user-event
- **E2E Tests**: Playwright with accessibility checks (axe-core)
- **CI/CD**: GitHub Actions with test reporting

## Running Tests

### All Tests
```bash
npm run test:all
```

### Backend Tests Only
```bash
cd backend
npm test
```

### Frontend Tests Only
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### E2E Tests (Headed Mode)
```bash
npm run test:e2e:headed
```

### Watch Mode (Development)
```bash
cd backend && npm run test:watch
# or
cd frontend && npm test
```

## Test Coverage

### Backend Tests
- **Settings API** (`backend/src/routes/__tests__/settings.test.js`)
  - GET /api/settings - Fetch user settings with defaults
  - POST /api/settings - Save/update all settings
  - PUT /api/settings/:key - Update individual setting
  - DELETE /api/settings - Reset to defaults
  - Authentication and validation checks

- **Auth API** (`backend/src/routes/__tests__/auth.test.js`)
  - POST /api/auth/register - User registration
  - POST /api/auth/login - User authentication
  - Validation and error handling

### Frontend Tests
- **AppStateContext** (`frontend/src/contexts/__tests__/AppStateContext.test.jsx`)
  - Initial state loading
  - Optimistic updates with rollback
  - Timer preset CRUD operations
  - Reminder CRUD operations
  - Goal update operations
  - Settings persistence

- **ProfileModuleControls** (`frontend/src/components/__tests__/ProfileModuleControls.test.jsx`)
  - Tab navigation (Timer/Reminders/Goals)
  - Timer settings modification
  - Timer preset creation and deletion
  - Reminder toggles and creation
  - Goal target updates
  - UI interaction validation

### E2E Tests (`e2e/app.spec.js`)
- **Authentication Flow**
  - Login page display and validation
  - Registration flow
  - Error handling for invalid inputs
  - Accessibility checks

- **UI Element Discovery**
  - Automatic detection of all interactive elements
  - Button, link, and form input validation
  - Navigation menu validation

- **Performance Checks**
  - Homepage load time validation (<5s)

- **Full User Journey** (requires auth setup)
  - Login → Profile → Timer preset creation
  - Reminder management
  - Goal settings modification

## Environment Setup

### Required Environment Variables

#### Backend (.env)
```env
# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-chars

# Database
MONGODB_URI=mongodb://localhost:27017/study-guardian

# Server
PORT=5004
NODE_ENV=development

# Optional: Email (for demo, uses console logging)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=demo@example.com
SMTP_PASS=demo-password

# Optional: Firebase (for push notifications)
FIREBASE_PROJECT_ID=demo-project
FIREBASE_PRIVATE_KEY=demo-key
FIREBASE_CLIENT_EMAIL=demo@example.com

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Demo/Test Environment Setup

If you don't have real credentials, the application will work with these demo values:

```bash
# Backend - Create backend/.env.test
JWT_SECRET=test-secret-key-for-automated-testing-minimum-32-characters
MONGODB_URI=mongodb://localhost:27017/study-guardian-test
PORT=5004
NODE_ENV=test
```

### Database Setup

#### Install MongoDB locally
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or use MongoDB Community Server installer
# https://www.mongodb.com/try/download/community
```

#### Or use MongoDB Memory Server (automatic in tests)
The test suite automatically uses `mongodb-memory-server` for isolated testing.

## CI/CD Integration

### GitHub Actions
The `.github/workflows/test.yml` workflow runs automatically on:
- Push to `main`, `develop`, or `feature/*` branches
- Pull requests to `main` or `develop`

### Workflow Steps
1. **Backend Unit Tests** - Run Jest tests with coverage
2. **Frontend Unit Tests** - Run React Testing Library tests
3. **E2E Tests** - Run Playwright tests with accessibility checks
4. **Test Report** - Generate consolidated test report

### Viewing Test Results
- Test artifacts are uploaded for each run
- Coverage reports available in artifacts
- Playwright HTML report for E2E test visualization
- JUnit XML for CI integration

## Test Maintenance

### Adding New Tests

#### Backend
```javascript
// backend/src/routes/__tests__/yourFeature.test.js
const request = require('supertest');
const app = require('../../testApp');

describe('Your Feature', () => {
  it('should do something', async () => {
    const response = await request(app).get('/api/your-route');
    expect(response.status).toBe(200);
  });
});
```

#### Frontend
```javascript
// frontend/src/components/__tests__/YourComponent.test.jsx
import { render, screen } from '@testing-library/react';
import YourComponent from '../YourComponent';

test('renders component', () => {
  render(<YourComponent />);
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});
```

#### E2E
```javascript
// e2e/yourFeature.spec.js
import { test, expect } from '@playwright/test';

test('user can do something', async ({ page }) => {
  await page.goto('/your-page');
  await page.click('button[name="action"]');
  await expect(page.locator('.result')).toBeVisible();
});
```

## Troubleshooting

### Backend Tests Failing
- **MongoDB Connection**: Ensure MongoDB is running or mongodb-memory-server is installed
- **JWT_SECRET**: Set in environment or tests will use default
- **Port Conflicts**: Ensure port 5004 is available

### Frontend Tests Failing
- **Dependencies**: Run `npm ci` in frontend directory
- **React Scripts**: Ensure react-scripts is properly installed
- **Mock Issues**: Check mock implementations in test files

### E2E Tests Failing
- **Servers Not Running**: Use `npm run dev` to start both servers
- **Timeout Issues**: Increase timeout in playwright.config.js
- **Browser Issues**: Run `npx playwright install` to install browsers
- **Authentication**: Some tests require auth setup (currently skipped)

## Test Fixes Applied

### Backend Fixes
1. ✅ Fixed `req.user.userId` → `req.user._id` in settings routes
2. ✅ Fixed socket room naming (`user:${userId}` consistency)
3. ✅ Added socket event handlers (join-user-room, leave-user-room)
4. ✅ Created testApp.js for isolated Express testing

### Frontend Fixes
1. ✅ Added proper mocking for AppStateContext tests
2. ✅ Configured jest to handle axios ESM imports
3. ✅ Added @testing-library dependencies

### Known Limitations
- OAuth tests require real Google credentials (currently uses demo mode)
- Email tests use console logging in test environment
- Push notification tests simulate Firebase (no real push)
- Full E2E user journey test requires authentication setup (currently skipped)

## Continuous Improvement

To extend test coverage:
1. Add more edge cases for timer/reminder/goal operations
2. Add tests for socket.io real-time updates
3. Add tests for file upload/download features
4. Add performance benchmarks for API response times
5. Add visual regression testing with Playwright
6. Add load testing with Artillery or k6

## Contact & Support
For test-related issues, check:
- Test logs in GitHub Actions
- Coverage reports in artifacts
- Playwright trace viewer for E2E failures
