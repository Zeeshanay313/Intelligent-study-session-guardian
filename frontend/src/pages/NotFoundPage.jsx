import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-secondary-800 py-8 px-4 shadow rounded-lg sm:px-10">
          <div className="text-center">
            {/* 404 Illustration */}
            <div className="mx-auto h-32 w-32 text-primary-600 dark:text-primary-400 mb-8">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.067M6.343 6.343A8 8 0 0112 4c4.418 0 8 3.582 8 8 0 1.436-.378 2.785-1.036 3.953"
                />
              </svg>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 mb-2">
                404
              </h1>
              <h2 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-4">
                Page Not Found
              </h2>
              <p className="text-secondary-600 dark:text-secondary-400 mb-8">
                Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link to="/">
                <Button className="w-full">
                  Go Home
                </Button>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex justify-center py-2 px-4 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm bg-white dark:bg-secondary-700 text-sm font-medium text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Go Back
              </button>
            </div>

            {/* Help Links */}
            <div className="mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700">
              <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
                Need help? Here are some useful links:
              </p>
              <div className="flex flex-col space-y-2 text-sm">
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          © 2024 Study Guardian. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;