import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * PublicLayout
 * Used by all public-facing and auth pages.
 * Renders the shared Sidebar, Header, Footer, and MobileBottomNav.
 * Page content is injected via <Outlet />.
 */
export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* Permanent Left Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">

        {/* Top Header Bar */}
        <Header />

        {/* Page Body Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
};
