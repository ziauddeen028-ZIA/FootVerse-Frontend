import React from 'react';

/**
 * TournamentCardSkeleton - Reusable skeleton placeholder for tournament cards
 * Matches the exact layout, sizes, and spacing of Featured and Organizer tournament cards
 * 
 * @param {number} count - Number of skeleton cards to render (default: 6)
 * @param {string} className - Optional container grid override
 */
export const TournamentCardSkeleton = ({ count = 6, className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" }) => {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="saas-card p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E3A29] bg-white dark:bg-[#101C14] flex flex-col justify-between space-y-4 animate-pulse shadow-xs"
        >
          <div>
            {/* Top Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-full w-24"></div>
              <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-xl w-28"></div>
            </div>

            {/* Tournament Title */}
            <div className="h-5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-3/4 mb-2"></div>

            {/* Description lines */}
            <div className="space-y-1.5 mt-2">
              <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-full"></div>
              <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-4/5"></div>
            </div>

            {/* Location & Date */}
            <div className="space-y-2.5 pt-4">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-24"></div>
                <div className="h-3 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-20"></div>
              </div>

              {/* Progress Bar for Registration */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <div className="h-2.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-24"></div>
                  <div className="h-2.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-10"></div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#16261C] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-slate-200 dark:bg-[#1E3A29] h-1.5 rounded-full w-1/3"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#1E3A29] flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="h-2 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-12"></div>
              <div className="h-3.5 bg-slate-200 dark:bg-[#1E3A29] rounded-md w-16"></div>
            </div>
            <div className="h-8 bg-slate-200 dark:bg-[#1E3A29] rounded-xl w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TournamentCardSkeleton;
