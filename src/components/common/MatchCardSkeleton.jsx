import React from 'react';

/**
 * MatchCardSkeleton - Reusable skeleton placeholder for match cards
 * Matches the exact layout, sizes, and spacing of Match Scorecenter cards
 * 
 * @param {number} count - Number of skeleton cards to render (default: 6)
 * @param {string} className - Optional container grid override
 */
export const MatchCardSkeleton = ({ count = 6, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl border border-slate-200/70 dark:border-[#1E3A29] bg-slate-50/80 dark:bg-[#16261C]/80 flex flex-col justify-between animate-pulse shadow-xs"
        >
          {/* Top Bar: Tournament Name & Status Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-28"></div>
            <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-full w-16"></div>
          </div>

          {/* Team vs Team Scoreboard */}
          <div className="py-3 px-4 rounded-xl bg-white dark:bg-[#101C14] border border-slate-200/60 dark:border-[#1E3A29] space-y-3">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1E3A29] shrink-0"></div>
                <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-24"></div>
              </div>
              <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-4"></div>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#1E3A29] shrink-0"></div>
                <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-20"></div>
              </div>
              <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-4"></div>
            </div>
          </div>

          {/* Match Info & Venue Footer */}
          <div className="pt-3 flex items-center justify-between text-[11px]">
            <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-20"></div>
            <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-14"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MatchCardSkeleton;
