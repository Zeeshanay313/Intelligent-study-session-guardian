/**
 * AppLayout Component
 * 
 * Modern application shell with:
 * - Sleek collapsible left sidebar navigation
 * - Minimal top bar with theme toggle, user avatar, notifications
 * - Responsive content area with max-width container
 */

import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Home,
  Clock,
  Target,
  Folder,
  Trophy,
  Award,
  Calendar,
  User,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Shield,
  Activity,
  Eye,
  Sparkles
} from 'lucide-react'

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const isAdmin = user?.user?.role === 'admin'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Focus Timer', href: '/focus', icon: Clock },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Resources', href: '/resources', icon: Folder },
    { name: 'Motivation', href: '/motivation', icon: Trophy },
    { name: 'Rewards', href: '/rewards', icon: Award },
    { name: 'Blocker', href: '/distraction', icon: Eye },
    { name: 'Activity', href: '/activity-logger', icon: Activity },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/profile', icon: User },
    ...(isAdmin ? [{ name: 'Admin', href: '/admin', icon: Shield, adminOnly: true }] : []),
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const displayName = user?.profile?.displayName || 'User'
  const initials = displayName.charAt(0).toUpperCase()
  const email = user?.user?.email || ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B1120] transition-colors duration-200">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-[fadeIn_200ms_ease-out]"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white dark:bg-gray-900 border-r border-gray-200/80 dark:border-gray-800
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className={`flex h-16 shrink-0 items-center border-b border-gray-100 dark:border-gray-800 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/20">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <div className="leading-tight">
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Study Guardian</span>
                <span className="block text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Intelligent</span>
              </div>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-500/20">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </Link>
          )}

          {/* Desktop collapse button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin" aria-label="Main navigation">
          {!sidebarCollapsed && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">Menu</p>
          )}
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`
                      group relative flex items-center rounded-xl transition-all duration-150
                      ${sidebarCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5'}
                      ${active
                        ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                      }
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                    `}
                    title={sidebarCollapsed ? item.name : undefined}
                    aria-label={item.name}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-600 dark:bg-primary-400" />
                    )}
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="text-[13px] truncate">{item.name}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-3">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:block" />

            {/* Right actions */}
            <div className="flex items-center gap-1">
              {/* Theme */}
              <button
                onClick={toggleTheme}
                className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
              </button>

              {/* Notifications */}
              <button
                className="relative rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
              </button>

              {/* Divider */}
              <div className="mx-2 h-6 w-px bg-gray-200 dark:bg-gray-700" />

              {/* User avatar */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Profile"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-xs font-bold text-white">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{displayName}</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="min-h-[calc(100vh-3.5rem)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
