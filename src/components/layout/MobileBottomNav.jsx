import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Trophy, Activity, BarChart2, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tournaments', path: '/tournaments-preview', icon: Trophy, badge: 'Phase 2' },
    { label: 'Live', path: '/matches-preview', icon: Activity, badge: 'Phase 2' },
    { label: 'Stats', path: '/stats', icon: BarChart2 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card border-t border-slate-200/80 dark:border-slate-800/80 backdrop-blur-lg px-2 py-1.5">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 px-3 rounded-2xl transition-all relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 right-1 px-1 py-0.2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[8px] font-extrabold rounded-full">
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
