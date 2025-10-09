import React from 'react';
import Header from './Header';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900">
      <Header />
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;