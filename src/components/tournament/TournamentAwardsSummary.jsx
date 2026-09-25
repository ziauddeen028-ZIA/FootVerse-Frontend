import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Shield, Star, Award, Sparkles, ExternalLink } from 'lucide-react';
import { tournamentService } from '../../services/tournamentService';

// Module-level cache to deduplicate requests across cards
const statsCache = new Map();

export const fetchTournamentAwards = (tournamentId) => {
  if (!tournamentId || typeof tournamentId !== 'string') return Promise.resolve(null);
  if (statsCache.has(tournamentId)) {
    return statsCache.get(tournamentId);
  }
  const promise = tournamentService
    .getStatsOverview(tournamentId)
    .then((data) => data || null)
    .catch(() => null);

  statsCache.set(tournamentId, promise);
  return promise;
};

export const clearTournamentAwardsCache = (tournamentId) => {
  if (tournamentId) {
    statsCache.delete(tournamentId);
  } else {
    statsCache.clear();
  }
};

const MiniAvatar = ({ url, name, ringColor = 'ring-amber-400/40', badgeIcon: BadgeIcon, badgeBg = 'bg-amber-500' }) => {
  const initials = name
    ? name
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className="relative shrink-0">
      {url ? (
        <img
          src={url}
          alt={name || 'Player'}
          loading="lazy"
          className={`w-7 h-7 rounded-full object-cover ring-2 ${ringColor} bg-slate-200 dark:bg-slate-700`}
        />
      ) : (
        <div
          className={`w-7 h-7 rounded-full ring-2 ${ringColor} bg-slate-100 dark:bg-[#16261C] text-slate-700 dark:text-slate-200 flex items-center justify-center text-[10px] font-black tracking-tight`}
        >
          {initials}
        </div>
      )}
      {BadgeIcon && (
        <span
          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${badgeBg} text-white flex items-center justify-center ring-1.5 ring-white dark:ring-[#101C14] shadow-xs`}
        >
          <BadgeIcon className="w-2 h-2 text-white" />
        </span>
      )}
    </div>
  );
};

/**
 * Premium Tournament Awards Summary (Tournament Detail Page)
 * 3-Column Desktop Grid / Responsive Mobile Stack
 * Publicly visible to all users (spectators, players, organizers)
 * Clickable player names link directly to `/players?id=${playerId}`
 */
export const TournamentAwardsSummary = ({ tournamentId, initialAwards = null }) => {
  const [awards, setAwards] = useState(initialAwards);
  const [loading, setLoading] = useState(!initialAwards);

  useEffect(() => {
    let isMounted = true;

    if (initialAwards) {
      setAwards(initialAwards);
      setLoading(false);
      return;
    }

    if (!tournamentId) {
      setAwards(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchTournamentAwards(tournamentId).then((data) => {
      if (isMounted) {
        setAwards(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [tournamentId, initialAwards]);

  const topScorer = awards?.topScorer;
  const bestKeeper = awards?.bestKeeper;
  const bestPlayer = awards?.bestPlayer;

  const topScorerPlayer = topScorer?.player || (topScorer?.fullName ? topScorer : null);
  const topScorerId = topScorerPlayer?.id || topScorer?.playerId || topScorer?.id;
  const topScorerName = topScorerPlayer?.fullName;
  const topScorerAvatar = topScorerPlayer?.avatarUrl;
  const topScorerTeam = topScorer?.team?.name || topScorer?.team?.shortName;
  const topScorerGoals = topScorer?.goals ?? 0;

  const bestKeeperPlayer = bestKeeper?.player || (bestKeeper?.fullName ? bestKeeper : null);
  const bestKeeperId = bestKeeperPlayer?.id || bestKeeper?.playerId || bestKeeper?.id;
  const bestKeeperName = bestKeeperPlayer?.fullName;
  const bestKeeperAvatar = bestKeeperPlayer?.avatarUrl;
  const bestKeeperTeam = bestKeeper?.team?.name || bestKeeper?.team?.shortName;
  const bestKeeperCleanSheets = bestKeeper?.cleanSheets ?? 0;

  const bestPlayerObj = bestPlayer?.player || (bestPlayer?.fullName ? bestPlayer : null);
  const bestPlayerId = bestPlayerObj?.id || bestPlayer?.playerId || bestPlayer?.id;
  const bestPlayerName = bestPlayerObj?.fullName;
  const bestPlayerAvatar = bestPlayerObj?.avatarUrl;
  const bestPlayerTeam = bestPlayer?.team?.name || bestPlayer?.team?.shortName;
  const bestPlayerPosition = bestPlayerObj?.preferredPosition || 'MVP';

  return (
    <div className="w-full space-y-3">
      {/* Trophy / Medal Style Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-slate-950 fill-slate-950/40" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-amber-600 via-emerald-600 to-teal-600 dark:from-amber-400 dark:via-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
              Tournament Awards
            </h3>
          </div>
        </div>
        <div className="h-[1px] flex-1 ml-3 bg-gradient-to-r from-slate-200 dark:from-[#1E3A29] to-transparent" />
      </div>

      {/* 3 Premium Award Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ─── 1. TOP SCORER (🏆) ────────────────────────────────────── */}
        <div
          className="bg-gradient-to-br from-amber-500/[0.08] via-slate-50/90 to-white dark:from-amber-950/30 dark:via-[#122217]/80 dark:to-[#0d1a12] border border-amber-500/25 dark:border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 shadow-xs relative overflow-hidden group min-h-[82px]"
          title={topScorerName ? `Top Scorer: ${topScorerName} (${topScorerGoals} ${topScorerGoals === 1 ? 'goal' : 'goals'})` : 'Top Scorer: No goals recorded'}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-400/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />

          {/* Header pill */}
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-700 dark:text-amber-400 pb-2 border-b border-amber-500/15 dark:border-amber-500/10">
            <span className="flex items-center gap-1.5">
              <span>🏆</span>
              <span className="tracking-wide uppercase font-extrabold text-[10px]">Top Scorer</span>
            </span>
            {topScorerName && (
              <span className="text-[9.5px] font-semibold text-amber-600/90 dark:text-amber-400/90">Golden Boot</span>
            )}
          </div>

          {/* Body */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            {loading ? (
              <div className="flex items-center gap-2.5 w-full animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ) : topScorerName ? (
              <>
                {topScorerId ? (
                  <Link
                    to={`/players?id=${topScorerId}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group/player cursor-pointer focus:outline-none"
                    title={`View ${topScorerName}'s public profile`}
                  >
                    <MiniAvatar
                      url={topScorerAvatar}
                      name={topScorerName}
                      ringColor="ring-amber-500/40 group-hover/player:ring-amber-500 transition-all"
                      badgeIcon={Trophy}
                      badgeBg="bg-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight group-hover/player:text-green-600 dark:group-hover/player:text-green-400 group-hover/player:underline transition-colors flex items-center gap-1">
                        <span>{topScorerName}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0" />
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {topScorerTeam || 'Top Striker'}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MiniAvatar
                      url={topScorerAvatar}
                      name={topScorerName}
                      ringColor="ring-amber-500/40"
                      badgeIcon={Trophy}
                      badgeBg="bg-amber-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                        {topScorerName}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {topScorerTeam || 'Top Striker'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prominent Stat */}
                <div className="text-right shrink-0 pl-1">
                  <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 leading-none">
                    {topScorerGoals}
                  </span>
                  <span className="block text-[8.5px] font-bold text-amber-700/80 dark:text-amber-400/80 uppercase tracking-wider">
                    {topScorerGoals === 1 ? 'Goal' : 'Goals'}
                  </span>
                </div>
              </>
            ) : (
              /* Polished Empty State (Navigation Disabled) */
              <div className="flex items-center justify-between w-full py-0.5 cursor-default select-none pointer-events-none">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <div className="w-7 h-7 rounded-full border border-dashed border-amber-500/30 dark:border-amber-500/20 flex items-center justify-center text-xs text-amber-600/70">
                    ⚽
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Awaiting goals</span>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-600">—</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. BEST GOALKEEPER (🧤) ────────────────────────────────── */}
        <div
          className="bg-gradient-to-br from-emerald-500/[0.08] via-slate-50/90 to-white dark:from-emerald-950/30 dark:via-[#122217]/80 dark:to-[#0d1a12] border border-emerald-500/25 dark:border-emerald-500/20 hover:border-emerald-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 shadow-xs relative overflow-hidden group min-h-[82px]"
          title={bestKeeperName ? `Best GK: ${bestKeeperName} (${bestKeeperCleanSheets} clean sheets)` : 'Best GK: No clean sheets recorded'}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />

          {/* Header pill */}
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 dark:text-emerald-400 pb-2 border-b border-emerald-500/15 dark:border-emerald-500/10">
            <span className="flex items-center gap-1.5">
              <span>🧤</span>
              <span className="tracking-wide uppercase font-extrabold text-[10px]">Best GK</span>
            </span>
            {bestKeeperName && (
              <span className="text-[9.5px] font-semibold text-emerald-600/90 dark:text-emerald-400/90">Golden Glove</span>
            )}
          </div>

          {/* Body */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            {loading ? (
              <div className="flex items-center gap-2.5 w-full animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ) : bestKeeperName ? (
              <>
                {bestKeeperId ? (
                  <Link
                    to={`/players?id=${bestKeeperId}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group/player cursor-pointer focus:outline-none"
                    title={`View ${bestKeeperName}'s public profile`}
                  >
                    <MiniAvatar
                      url={bestKeeperAvatar}
                      name={bestKeeperName}
                      ringColor="ring-emerald-500/40 group-hover/player:ring-emerald-500 transition-all"
                      badgeIcon={Shield}
                      badgeBg="bg-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight group-hover/player:text-green-600 dark:group-hover/player:text-green-400 group-hover/player:underline transition-colors flex items-center gap-1">
                        <span>{bestKeeperName}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0" />
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {bestKeeperTeam || 'Goalkeeper'}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MiniAvatar
                      url={bestKeeperAvatar}
                      name={bestKeeperName}
                      ringColor="ring-emerald-500/40"
                      badgeIcon={Shield}
                      badgeBg="bg-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                        {bestKeeperName}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {bestKeeperTeam || 'Goalkeeper'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prominent Stat */}
                <div className="text-right shrink-0 pl-1">
                  <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {bestKeeperCleanSheets}
                  </span>
                  <span className="block text-[8.5px] font-bold text-emerald-700/80 dark:text-emerald-400/80 uppercase tracking-wider">
                    {bestKeeperCleanSheets === 1 ? 'Clean Sheet' : 'Clean Sheets'}
                  </span>
                </div>
              </>
            ) : (
              /* Polished Empty State (Navigation Disabled) */
              <div className="flex items-center justify-between w-full py-0.5 cursor-default select-none pointer-events-none">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <div className="w-7 h-7 rounded-full border border-dashed border-emerald-500/30 dark:border-emerald-500/20 flex items-center justify-center text-xs text-emerald-600/70">
                    🛡️
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">No clean sheets</span>
                </div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-600">—</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. BEST PLAYER (⭐) ───────────────────────────────────── */}
        <div
          className="bg-gradient-to-br from-violet-500/[0.08] via-slate-50/90 to-white dark:from-violet-950/30 dark:via-[#122217]/80 dark:to-[#0d1a12] border border-violet-500/25 dark:border-violet-500/20 hover:border-violet-500/50 rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 shadow-xs relative overflow-hidden group min-h-[82px]"
          title={bestPlayerName ? `Best Player: ${bestPlayerName}` : 'Best Player: Organizer selection pending'}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-400/10 rounded-full blur-xl pointer-events-none -mr-4 -mt-4" />

          {/* Header pill */}
          <div className="flex items-center justify-between text-[10px] font-bold text-violet-700 dark:text-violet-400 pb-2 border-b border-violet-500/15 dark:border-violet-500/10">
            <span className="flex items-center gap-1.5">
              <span>⭐</span>
              <span className="tracking-wide uppercase font-extrabold text-[10px]">Best Player</span>
            </span>
            <span className="text-[9.5px] font-semibold text-violet-600/90 dark:text-violet-400/90">MVP Award</span>
          </div>

          {/* Body */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            {loading ? (
              <div className="flex items-center gap-2.5 w-full animate-pulse">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            ) : bestPlayerName ? (
              <>
                {bestPlayerId ? (
                  <Link
                    to={`/players?id=${bestPlayerId}`}
                    className="flex items-center gap-2.5 min-w-0 flex-1 group/player cursor-pointer focus:outline-none"
                    title={`View ${bestPlayerName}'s public profile`}
                  >
                    <MiniAvatar
                      url={bestPlayerAvatar}
                      name={bestPlayerName}
                      ringColor="ring-violet-500/40 group-hover/player:ring-violet-500 transition-all"
                      badgeIcon={Star}
                      badgeBg="bg-violet-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight group-hover/player:text-green-600 dark:group-hover/player:text-green-400 group-hover/player:underline transition-colors flex items-center gap-1">
                        <span>{bestPlayerName}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0" />
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {bestPlayerTeam || bestPlayerPosition || 'Tournament MVP'}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MiniAvatar
                      url={bestPlayerAvatar}
                      name={bestPlayerName}
                      ringColor="ring-violet-500/40"
                      badgeIcon={Star}
                      badgeBg="bg-violet-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-[13px] font-black text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                        {bestPlayerName}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {bestPlayerTeam || bestPlayerPosition || 'Tournament MVP'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Prominent MVP Tag */}
                <div className="text-right shrink-0 pl-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 text-white font-black text-[10.5px] tracking-wider shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    <span>MVP</span>
                  </span>
                </div>
              </>
            ) : (
              /* Polished Empty State (Navigation Disabled) */
              <div className="flex items-center justify-between w-full py-0.5 cursor-default select-none pointer-events-none">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <div className="w-7 h-7 rounded-full border border-dashed border-violet-500/30 dark:border-violet-500/20 flex items-center justify-center text-xs text-violet-500">
                    ⭐
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">To Be Decided</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Organizer Pick</span>
                  </div>
                </div>
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#16261C] text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-[#1E3A29]">
                  TBD
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
