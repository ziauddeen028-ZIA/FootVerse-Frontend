import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 mt-12 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="text-base">⚽</span>
          <span className="font-bold text-slate-900 dark:text-white">FootVerse</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved. Inspired by CricHeroes for Football.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Terms of Service</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
            Phase 1 Active
          </span>
        </div>
      </div>
    </footer>
  );
};
