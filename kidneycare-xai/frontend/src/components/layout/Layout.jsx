import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useTheme } from '../../context/ThemeContext';

export const Layout = () => {
  const { isBrutalist } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isBrutalist
        ? 'bg-[var(--bg-page)] text-[var(--text-main)]'
        : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
    }`}>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
