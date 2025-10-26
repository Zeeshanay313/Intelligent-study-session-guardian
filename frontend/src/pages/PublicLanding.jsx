import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ClockIcon, BoltIcon, SparklesIcon, ChartBarIcon, ShieldCheckIcon, BellIcon } from '@heroicons/react/24/outline';

const PublicLanding = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-950 via-secondary-900 to-secondary-950 text-white">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -left-56 top-24 w-96 h-96 bg-neon-blue/10 rounded-full filter blur-3xl animate-pulse-glow" />
        <div className="absolute right-0 top-1/4 w-96 h-96 bg-neon-purple/10 rounded-full filter blur-3xl animate-pulse-glow" />
      </div>

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg">
            <AcademicCapIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink">StudyGuardian</div>
        </div>
        <nav className="space-x-4 hidden md:block">
          <Link to="/login" className="text-sm text-gray-300 hover:text-white">Sign In</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-blue to-neon-cyan text-black font-semibold ml-2">Get Started</Link>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-800/50 border border-neon-blue/20 mb-6">
              <SparklesIcon className="w-4 h-4 text-neon-blue mr-2" />
              <span className="text-sm text-gray-300">AI-Powered • Tailored for focused learning</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Master your study sessions with
              <span className="bg-gradient-to-r from-neon-blue to-neon-pink bg-clip-text text-transparent"> focus, clarity, and results</span>
            </h1>

            <p className="text-lg text-gray-300 mb-8 max-w-2xl">
              StudyGuardian combines Pomodoro timers, goal tracking and smart reminders with AI-driven insights to help you learn faster and retain more. Beautifully designed, privacy-first, and built for students.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-neon-blue to-neon-cyan rounded-xl text-black font-semibold shadow-lg transform hover:scale-105 transition">Get Started Free</Link>
              <a href="#features" className="inline-flex items-center gap-2 px-6 py-4 border border-secondary-700 rounded-xl text-gray-200 hover:bg-secondary-900 transition">See Features</a>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-gray-400">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">50M+</div>
                <div className="text-sm text-gray-400">Study Minutes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">95%</div>
                <div className="text-sm text-gray-400">Goal Success</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.9/5</div>
                <div className="text-sm text-gray-400">Avg Rating</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-secondary-900/50 border border-secondary-800 p-8 shadow-2xl">
              {/* Mock app preview */}
              <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-secondary-950 to-secondary-900 p-6">
                <div className="flex gap-4 h-full">
                  <div className="w-2/3 bg-secondary-800/40 rounded-lg p-4 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-4 border-neon-blue/30 flex items-center justify-center mb-4">
                      <div className="text-4xl font-bold text-neon-blue">25:00</div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-blue to-neon-cyan" />
                      <div className="w-12 h-12 rounded-full bg-secondary-700" />
                    </div>
                  </div>

                  <div className="w-1/3 flex flex-col gap-3">
                    <div className="h-2 bg-gradient-to-r from-neon-green to-neon-cyan rounded w-2/3" />
                    <div className="h-2 bg-gradient-to-r from-neon-purple to-neon-pink rounded w-3/4" />
                    <div className="h-2 bg-secondary-700 rounded w-1/2" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Start your first session</div>
                    <div className="text-lg font-semibold">Zero friction. Focus immediately.</div>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-cyan rounded-lg text-black font-semibold">Try it</Link>
                    <Link to="/login" className="px-4 py-2 border border-secondary-700 rounded-lg text-gray-200">Sign in</Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 right-6 w-44 h-44 bg-neon-purple/6 rounded-2xl filter blur-2xl" />
          </div>
        </div>

        {/* Features section */}
        <section id="features" className="mt-20">
          <h2 className="text-3xl font-bold mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-secondary-900/50 border border-secondary-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-6 h-6 text-neon-blue" />
                <div className="font-semibold">Pomodoro Timer</div>
              </div>
              <p className="text-sm text-gray-300">Customizable focus sessions and break schedules with session analytics.</p>
            </div>
            <div className="p-6 bg-secondary-900/50 border border-secondary-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <ChartBarIcon className="w-6 h-6 text-neon-purple" />
                <div className="font-semibold">Goal Tracking</div>
              </div>
              <p className="text-sm text-gray-300">Track milestones, visualize progress, and stay motivated with streaks.</p>
            </div>
            <div className="p-6 bg-secondary-900/50 border border-secondary-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <BellIcon className="w-6 h-6 text-neon-green" />
                <div className="font-semibold">Smart Reminders</div>
              </div>
              <p className="text-sm text-gray-300">Set contextual reminders and recurring schedules that adapt to your workload.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-secondary-800/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <AcademicCapIcon className="w-5 h-5 text-white" />
            </div>
            <div className="text-sm text-gray-300">StudyGuardian © 2025</div>
          </div>
          <div className="text-sm text-gray-400">Privacy • Terms • Contact</div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLanding;
