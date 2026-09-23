import React from 'react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-[#1E3A29] bg-white/50 dark:bg-[#101C14]/50 py-6 mt-12 mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded-lg bg-white dark:bg-[#16261C] border border-slate-200/80 dark:border-[#1E3A29] p-0.5 flex items-center justify-center shadow-xs flex-shrink-0">
            <img 
              src="/logo.webp" 
              alt="FootVerse Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">FootVerse</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved. Built with passion. Built for football.</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="hover:text-green-600 dark:hover:text-green-400 cursor-pointer transition">Privacy Policy</span>
          <span className="hover:text-green-600 dark:hover:text-green-400 cursor-pointer transition">Terms of Service</span>
          <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 font-semibold text-[10px]">
            Live Platform
          </span>
        </div>
      </div>
    </footer>
  );
};
