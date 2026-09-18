import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { TeamStatsView } from '../components/stats/TeamStatsView';

/**
 * Public read-only team detail page at /teams/:teamId.
 * Reuses the existing TeamStatsView component (already has public/private guards).
 * No organizer controls are shown — TeamStatsView is inherently read-only for public users.
 */
export const PublicTeamDetail = () => {
  const { teamId } = useParams();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <Link to="/" className="hover:text-blue-500 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/teams" className="hover:text-blue-500 transition">Teams</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-semibold">Team Profile</span>
      </div>

      {/* Back button */}
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Teams</span>
        </Link>
      </div>

      {/* Reuse existing TeamStatsView — read-only for public users by design */}
      <TeamStatsView
        initialTeamId={teamId}
        hideSelector={false}
      />
    </div>
  );
};

export default PublicTeamDetail;
