import React from 'react';

export const AuthLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0F19] text-white">
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring */}
        <div className="w-20 h-20 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin" />
        <span className="absolute text-2xl animate-bounce">⚽</span>
      </div>
      <h2 className="mt-6 text-xl font-bold font-heading tracking-tight text-slate-100">
        FootVerse Arena
      </h2>
      <p className="mt-1 text-xs text-slate-400 font-medium">
        Restoring session credentials...
      </p>
    </div>
  );
};
