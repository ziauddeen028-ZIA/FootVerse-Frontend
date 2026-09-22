import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Activity, BarChart2, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { 
      label: 'Home', 
      path: '/', 
      icon: Home,
      match: (pathname) => pathname === '/' || pathname === '/dashboard'
    },
    { 
      label: 'Tournaments', 
      path: '/tournaments', 
      icon: Trophy,
      match: (pathname) => pathname.startsWith('/tournaments')
    },
    { 
      label: 'Live', 
      path: '/matches?live=true', 
      icon: Activity,
      match: (pathname, search) => (pathname.startsWith('/matches') && search.includes('live=true')) || pathname === '/live'
    },
    { 
      label: 'Stats', 
      path: '/stats', 
      icon: BarChart2,
      match: (pathname) => pathname.startsWith('/stats') || pathname.startsWith('/teams') || pathname.startsWith('/players')
    },
    { 
      label: 'Profile', 
      path: '/profile', 
      icon: User,
      match: (pathname) => pathname.startsWith('/profile')
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#101C14]/95 border-t border-slate-200/85 dark:border-[#1E3A29] backdrop-blur-lg px-2 py-1.5">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match 
            ? item.match(location.pathname, location.search) 
            : location.pathname === item.path;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-green-600 dark:text-green-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 right-1 px-1 py-0.2 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-[8px] font-extrabold rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
