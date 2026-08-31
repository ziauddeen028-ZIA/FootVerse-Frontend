import React from 'react';
import { Trophy, Award, Shield, ChevronUp, ChevronDown, Minus, Info } from 'lucide-react';

export const LeagueStandings = ({ standings = [], tournamentName = '', isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700/60 rounded-lg"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render a single table for a given standings array
  const renderTable = (tableData) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="text-center py-10 px-4 text-slate-500 dark:text-slate-400">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
          <p className="text-sm font-medium">No standings data available yet.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Standings will update automatically as matches are played.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 select-none">
            <tr>
              <th className="py-3 px-3 sm:px-4 text-center w-12 sm:w-16">Pos</th>
              <th className="py-3 px-3 sm:px-4 min-w-[140px] sm:min-w-[200px]">Club</th>
              <th className="py-3 px-2 sm:px-3 text-center">P</th>
              <th className="py-3 px-2 sm:px-3 text-center">W</th>
              <th className="py-3 px-2 sm:px-3 text-center">D</th>
              <th className="py-3 px-2 sm:px-3 text-center">L</th>
              <th className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">GF</th>
              <th className="py-3 px-2 sm:px-3 text-center hidden md:table-cell">GA</th>
              <th className="py-3 px-2 sm:px-3 text-center">GD</th>
              <th className="py-3 px-3 sm:px-4 text-center font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                Pts
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#141C2E]">
            {tableData.map((row, index) => {
              const pos = row.position || index + 1;
              const isLeader = pos === 1;
              const isTopThree = pos > 1 && pos <= 3;
              const isRelegation = pos > 0 && pos === tableData.length && tableData.length >= 4;

              const gd = row.goalDifference ?? (row.goalsFor - row.goalsAgainst);
              const gdFormatted = gd > 0 ? `+${gd}` : gd;

              return (
                <tr
                  key={row.team?.id || index}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    isLeader ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {/* Position */}
                  <td className="py-3.5 px-3 sm:px-4 text-center">
                    <div className="flex items-center justify-center">
                      {isLeader ? (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-xs">
                          1
                        </span>
                      ) : isTopThree ? (
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold text-xs">
                          {pos}
                        </span>
                      ) : (
                        <span className={`text-xs font-semibold ${isRelegation ? 'text-red-500 dark:text-red-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {pos}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Team Info */}
                  <td className="py-3.5 px-3 sm:px-4">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-700">
                        {row.team?.logoUrl ? (
                          <img src={row.team.logoUrl} alt={row.team.name} className="w-full h-full object-cover" />
                        ) : (
                          row.team?.shortName || row.team?.name?.substring(0, 3).toUpperCase() || 'FC'
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold text-xs sm:text-sm truncate ${isLeader ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-200'}`}>
                          {row.team?.name || 'Unknown Team'}
                        </p>
                        {row.team?.shortName && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase sm:hidden">
                            {row.team.shortName}
                          </p>
                        )}
                      </div>
                      {isLeader && (
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-auto hidden sm:block" />
                      )}
                    </div>
                  </td>

                  {/* Match Stats */}
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {row.played ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {row.won ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                    {row.drawn ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium text-red-500 dark:text-red-400">
                    {row.lost ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">
                    {row.goalsFor ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hidden md:table-cell">
                    {row.goalsAgainst ?? 0}
                  </td>
                  <td className="py-3.5 px-2 sm:px-3 text-center text-xs sm:text-sm font-bold">
                    <span className={gd > 0 ? 'text-emerald-600 dark:text-emerald-400' : gd < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-500'}>
                      {gdFormatted}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 sm:px-4 text-center text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30">
                    {row.points ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-[#141C2E] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {tournamentName ? `${tournamentName} Standings` : 'League Standings'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live table calculated from completed fixtures (3 pts win, 1 pt draw)
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>1st / Champion</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>Top 3</span>
          </div>
        </div>
      </div>

      {/* Render single flat standings table */}
      {renderTable(standings)}
    </div>
  );
};
