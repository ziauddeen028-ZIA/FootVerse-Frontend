import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GlobalSearchBar } from './GlobalSearchBar';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

// ─── Header ───────────────────────────────────────────────────────────────────
export const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#101C14]/95 border-b border-slate-200/85 dark:border-[#1E3A29] backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">

        {/* Search Bar & Mobile Logo */}
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <Link to="/" className="md:hidden flex items-center flex-shrink-0" aria-label="FootVerse Home">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] p-0.5 flex items-center justify-center shadow-xs">
              <img src="/logo.webp" alt="FootVerse Logo" className="w-full h-full object-contain rounded-lg" />
            </div>
          </Link>
          <div className="w-full">
            <GlobalSearchBar />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C] rounded-xl transition"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-[#16261C] transition"
            >
              <div className="w-8 h-8 rounded-lg bg-green-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-green-600/20">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 floating-glass rounded-2xl shadow-xl py-1 z-50 border border-slate-200 dark:border-[#1E3A29]"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-slate-100 dark:border-[#1E3A29]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile?.full_name || 'FootVerse Athlete'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Registered User'}</p>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                >
                  <User className="w-3.5 h-3.5 mr-2 text-green-600 dark:text-green-400" /> Profile Settings
                </Link>
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center px-4 py-2 text-xs text-green-600 dark:text-green-400 hover:bg-slate-100 dark:hover:bg-[#16261C]"
                  >
                    <User className="w-3.5 h-3.5 mr-2" /> Sign In
                  </Link>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
