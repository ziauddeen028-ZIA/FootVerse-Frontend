import React from 'react';
import { TournamentCardSkeleton } from '../common/TournamentCardSkeleton';
import { MatchCardSkeleton } from '../common/MatchCardSkeleton';
import { PlayerCardSkeleton } from '../common/PlayerCardSkeleton';

export { TournamentCardSkeleton, MatchCardSkeleton, PlayerCardSkeleton };

export const LoadingSkeleton = ({ count = 4, type = 'default' }) => {
  if (type === 'tournament' || type === 'tournaments') {
    return <TournamentCardSkeleton count={count} />;
  }
  if (type === 'match' || type === 'matches' || type === 'card') {
    return <MatchCardSkeleton count={count} />;
  }
  if (type === 'player' || type === 'players') {
    return <PlayerCardSkeleton count={count} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white dark:bg-[#101C14] rounded-2xl p-6 border border-slate-200/80 dark:border-[#1E3A29] shadow-sm animate-pulse"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1 mr-4">
              <div className="h-4 bg-slate-200 dark:bg-[#16261C] rounded w-1/2"></div>
              <div className="h-8 bg-slate-200 dark:bg-[#16261C] rounded w-3/4"></div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-[#16261C] flex-shrink-0"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
