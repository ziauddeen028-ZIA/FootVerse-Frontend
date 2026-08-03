import React from 'react';

export const LoadingSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-[#141C2E] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1 mr-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
