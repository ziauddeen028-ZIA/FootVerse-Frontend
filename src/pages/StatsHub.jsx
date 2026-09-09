import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, User, Shield, Search, Sparkles, Trophy } from 'lucide-react';
import { MyStatsView } from '../components/stats/MyStatsView';
import { PlayerSearchView } from '../components/stats/PlayerSearchView';
import { TeamStatsView } from '../components/stats/TeamStatsView';
import { useAuth } from '../context/AuthContext';

export const StatsHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const tabParam = searchParams.get('tab');
  const idParam = searchParams.get('id');

  // Default tab: if user has tabParam, use it; otherwise default to 'my-stats' (or 'search' if guest)
  const resolveInitialTab = () => {
    if (tabParam === 'team') return 'team';
    if (tabParam === 'search' || tabParam === 'players') return 'search';
    if (tabParam === 'my-stats' || tabParam === 'player') return 'my-stats';
    return user ? 'my-stats' : 'search';
  };

  const [activeTab, setActiveTab] = useState(resolveInitialTab);

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'team') setActiveTab('team');
      else if (tabParam === 'search' || tabParam === 'players') setActiveTab('search');
      else if (tabParam === 'my-stats' || tabParam === 'player') setActiveTab('my-stats');
    }
  }, [tabParam]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>FootVerse Performance Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Player & Team Statistics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, personal tournament career stats, public scouting search, and squad performance.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-[#111726] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          {/* Tab 1: My Stats */}
          <button
            id="tab-my-stats"
            onClick={() => handleTabChange('my-stats')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'my-stats'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Stats</span>
          </button>

          {/* Tab 2: Search Players */}
          <button
            id="tab-search-players"
            onClick={() => handleTabChange('search')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'search'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search Players</span>
          </button>

          {/* Tab 3: Team Stats */}
          <button
            id="tab-team-stats"
            onClick={() => handleTabChange('team')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Team Stats</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-stats' && (
        <MyStatsView onSwitchToTeam={() => handleTabChange('team')} />
      )}

      {activeTab === 'search' && (
        <PlayerSearchView initialPlayerId={tabParam === 'player' ? idParam : null} />
      )}

      {activeTab === 'team' && (
        <TeamStatsView initialTeamId={tabParam === 'team' ? idParam : null} />
      )}
    </div>
  );
};

export default StatsHub;
