import React from 'react';

/**
 * PlayerCardSkeleton - Reusable skeleton placeholder for player cards
 * Matches the exact layout, sizes, and spacing of player listings in FootVerse
 * 
 * @param {number} count - Number of skeleton cards to render (default: 6)
 * @param {string} className - Optional container grid override
 */
export const PlayerCardSkeleton = ({ count = 6, className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#101C14] rounded-2xl border border-slate-200/80 dark:border-[#1E3A29] overflow-hidden shadow-sm flex flex-col animate-pulse"
        >
          <div className="p-6 flex-1">
            {/* Top Row: Position Badge & Actions */}
            <div className="flex justify-between items-start mb-4">
              <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-full w-20"></div>
              <div className="flex items-center gap-1">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1E3A29]"></div>
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1E3A29]"></div>
              </div>
            </div>

            {/* Player Avatar, Name & Jersey Number */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-[#1E3A29] shrink-0"></div>
              <div className="flex-1 space-y-2 min-w-0">
                <div className="h-4 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-1/2"></div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#16261C] border border-slate-200/60 dark:border-[#1E3A29] shrink-0"></div>
            </div>

            {/* Player Details: Team & Tournament */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E3A29]">
              <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-3/5"></div>
              <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-4/5"></div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="p-4 bg-slate-50 dark:bg-[#16261C] border-t border-slate-100 dark:border-[#1E3A29] flex justify-between items-center gap-2 shrink-0">
            <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-24"></div>
            <div className="h-6 bg-slate-200 dark:bg-[#1E3A29] rounded-lg w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PlayerCardSkeleton;
