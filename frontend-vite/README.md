# Intelligent Study Session Guardian - Frontend (Vite)

Modern, production-ready React frontend built with Vite for the Intelligent Study Session Guardian application.

## 🚀 Tech Stack

- **Build Tool**: Vite 5.x
- **Framework**: React 18.x
- **Routing**: React Router v6
- **Styling**: Tailwind CSS 3.x
- **UI Components**: Headless UI, Heroicons, Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios
- **State Management**: React Context + React Query (optional)
- **Testing**: Vitest, React Testing Library, Cypress
- **Code Quality**: ESLint, Prettier (optional)

## 📁 Project Structure

```
frontend-vite/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout/        # Layout components (AppLayout, Sidebar, etc.)
│   │   └── UI/            # UI primitives (Button, Input, Modal, etc.)
│   ├── contexts/          # React contexts (Auth, Theme)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   │   ├── Auth/          # Login, Register, ForgotPassword
│   │   ├── Dashboard/     # Main dashboard
│   │   ├── Focus/         # Focus timer
│   │   ├── Goals/         # Goal tracking
│   │   ├── Landing/       # Landing page
│   │   ├── Resources/     # Resource management
│   │   ├── Rewards/       # Rewards & achievements
│   │   ├── Settings/      # Profile & settings
│   │   └── Reports/       # Analytics & reports
│   ├── services/          # API services
│   │   ├── api.js         # Main API client
│   │   └── mockApi.js     # Mock API for development
│   ├── styles/            # Global styles
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # App entry point
│   └── index.css          # Global CSS with Tailwind
├── .env                   # Environment variables
├── .env.example           # Environment variables template
├── index.html             # HTML template
├── package.json           # Dependencies
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── README.md              # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js >= 16.x
- npm >= 8.x or yarn >= 1.22.x

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   # Backend API URL (leave empty to use mock API)
   VITE_API_BASE_URL=http://localhost:5004
   
   # Enable mock API (true = use mock data, false = use real backend)
   VITE_USE_MOCK_API=false
   
   # App environment
   VITE_APP_ENV=development
   
   # Enable debug logging
   VITE_DEBUG=true
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   
   App will open at `http://localhost:3000`

## 📜 Available Scripts

### Development

```bash
# Start dev server
npm run dev

# Start dev server with host exposure (for testing on other devices)
npm run dev -- --host
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests (Cypress)
npm run test:e2e

# Open Cypress interactive mode
npm run test:e2e:open
```

### Linting

```bash
# Lint code
npm run lint

# Lint and fix
npm run lint:fix
```

## 🔌 API Configuration

The app supports three modes:

### 1. Mock API Mode (Default for development)

Set in `.env`:
```env
VITE_USE_MOCK_API=true
```

- Uses mock data from `src/services/mockApi.js`
- No backend required
- Simulates network delays
- Perfect for frontend development and demos

### 2. Real Backend Mode

Set in `.env`:
```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:5004
```

- Connects to actual backend at specified URL
- Requires backend server running

### 3. Automatic Fallback Mode

The API service automatically falls back to mock API if the real backend is unavailable. This provides resilience during development.

## 🎨 Theming

### Light/Dark Mode

The app supports light and dark themes with automatic system preference detection.

**Programmatic control:**
```jsx
import { useTheme } from './contexts/ThemeContext'

function MyComponent() {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, isDark } = useTheme()
  
  return (
    <button onClick={toggleTheme}>
      Toggle Theme (current: {theme})
    </button>
  )
}
```

### Custom Styling

The app uses Tailwind CSS with custom design tokens defined in:
- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - CSS custom properties and global styles

## 🔐 Authentication

Authentication is managed through `AuthContext`:

```jsx
import { useAuth } from './contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()
  
  const handleLogin = async () => {
    const result = await login('demo@example.com', 'password')
    if (result.success) {
      console.log('Logged in:', result.user)
    }
  }
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  )
}
```

### Demo Credentials (Mock API)

- **Email**: demo@example.com
- **Password**: password

## 🧪 Testing

### Unit Tests (Vitest + React Testing Library)

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Example test:
```jsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from './Button'

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### E2E Tests (Cypress)

```bash
# Run E2E tests headlessly
npm run test:e2e

# Open Cypress GUI
npm run test:e2e:open
```

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

Output will be in `build/` directory.

### Environment Variables for Production

Create `.env.production`:
```env
VITE_API_BASE_URL=https://api.yourapp.com
VITE_USE_MOCK_API=false
VITE_APP_ENV=production
VITE_DEBUG=false
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Netlify

```bash
# Build
npm run build

# Deploy build/ folder to Netlify
```

### Docker Deployment

Use the provided Dockerfile in the root directory:
```bash
docker build -t study-guardian .
docker run -p 3000:3000 study-guardian
```

## 📱 Features

### Implemented

- ✅ Landing page with marketing content
- ✅ Authentication (Login, Register, Forgot Password)
- ✅ Dashboard with analytics and visualizations
- ✅ Focus Timer with keyboard shortcuts (Space, Esc)
- ✅ Goal tracking with progress visualization
- ✅ Rewards system with badges and points
- ✅ Resource management with filtering
- ✅ Profile settings with tabs
- ✅ Light/Dark theme with system preference
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Mock API for standalone development
- ✅ Accessibility features (WCAG AA compliant)
- ✅ Unit tests for critical components
- ✅ E2E tests for happy path

### Module Coverage (SRS Document)

- **Module 1**: Focus Session Management ✅
- **Module 2**: Goal Tracking & Progress Monitoring ✅
- **Module 3**: Smart Break Scheduler ✅
- **Module 4**: Resource Hub & Launcher ✅
- **Module 5**: Rewards & Gamification ✅
- **Module 6**: Profile & Settings Management ✅

## 🎯 Key Components

### Layout Components

- **AppLayout** - Main layout with sidebar and topbar
- **Sidebar** - Collapsible navigation sidebar
- **Topbar** - Header with search, notifications, theme toggle

### Page Components

- **Landing** - Marketing landing page
- **Dashboard** - Overview with metrics and charts
- **Focus** - Pomodoro-style focus timer
- **Goals** - Goal management with milestones
- **Rewards** - Badges, points, and achievements
- **Resources** - Resource library with filtering
- **Reports** - Session analytics and reports
- **Settings** - Profile, preferences, data management

### UI Components

- **Button** - Styled button with variants
- **Input** - Form input with validation
- **Card** - Content card container
- **Modal** - Dialog/modal component
- **Badge** - Status badge
- **Tabs** - Tab navigation

## 🔧 Configuration

### Vite Config (`vite.config.js`)

- React plugin enabled
- Dev server on port 3000
- API proxy to backend
- Path aliases (`@` → `src/`)
- Vitest configuration

### Tailwind Config (`tailwind.config.js`)

- Custom color palette
- Extended spacing and border radius
- Dark mode support
- Custom animations
- Typography configuration

## 🐛 Troubleshooting

### Port already in use

```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Mock API not working

Check `.env` file:
```env
VITE_USE_MOCK_API=true
```

### Backend connection issues

1. Verify backend is running on correct port
2. Check CORS settings on backend
3. Check network tab in browser DevTools
4. Verify API_BASE_URL in `.env`

### Build errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Documentation

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [React Router Documentation](https://reactrouter.com)
- [Headless UI Documentation](https://headlessui.com)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and test thoroughly
3. Run tests: `npm run test`
4. Commit: `git commit -m "Add my feature"`
5. Push: `git push origin feature/my-feature`
6. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Support

For questions or issues:
- Check existing issues on GitHub
- Create a new issue with detailed description
- Contact the development team

---

**Happy coding! 🎉**
