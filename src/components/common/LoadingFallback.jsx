import React from 'react';

export const LoadingFallback = ({ message = 'Loading FootVerse...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-16 px-4 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="w-14 h-14 rounded-full border-3 border-green-500/20 border-t-green-500 animate-spin" />
        <div className="absolute w-7 h-7 flex items-center justify-center">
          <img src="/logo.webp" alt="FootVerse Logo" className="w-full h-full object-contain animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 animate-pulse">
        {message}
      </p>
    </div>
  );
};
