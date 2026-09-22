import React from 'react';

export const AuthLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#07130C] text-slate-900 dark:text-white transition-colors duration-200">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="w-20 h-20 rounded-full border-4 border-green-600/30 border-t-green-500 animate-spin" />
        <span className="absolute text-2xl animate-bounce">⚽</span>
      </div>
      <h2 className="mt-6 text-xl font-bold font-heading tracking-tight text-slate-900 dark:text-white">
        FootVerse Arena
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
        Restoring session credentials...
      </p>
    </div>
  );
};
