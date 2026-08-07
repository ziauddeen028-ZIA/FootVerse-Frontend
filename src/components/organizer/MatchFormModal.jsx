import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Trophy, Shield, Activity } from 'lucide-react';

export const MatchFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  tournaments = [],
  teams = [],
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    tournamentId: '',
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    kickoffTime: '15:00',
    venue: '',
    status: 'scheduled'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        let formattedDate = '';
        let formattedTime = '15:00';

        if (initialData.matchDate) {
          const d = new Date(initialData.matchDate);
          if (!isNaN(d.getTime())) {
            formattedDate = d.toISOString().split('T')[0];
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            formattedTime = `${hours}:${minutes}`;
          }
        }

        setFormData({
          tournamentId: initialData.tournamentId || initialData.tournament?.id || (tournaments[0]?.id || ''),
          homeTeamId: initialData.homeTeamId || initialData.homeTeam?.id || '',
          awayTeamId: initialData.awayTeamId || initialData.awayTeam?.id || '',
          matchDate: formattedDate,
          kickoffTime: formattedTime,
          venue: initialData.venue || '',
          status: initialData.status || 'scheduled'
        });
      } else {
        const defaultTournamentId = tournaments[0]?.id || '';
        const tournamentTeams = teams.filter(t => t.tournamentId === defaultTournamentId || t.tournament?.id === defaultTournamentId);

        setFormData({
          tournamentId: defaultTournamentId,
          homeTeamId: tournamentTeams[0]?.id || '',
          awayTeamId: tournamentTeams[1]?.id || '',
          matchDate: new Date().toISOString().split('T')[0],
          kickoffTime: '15:00',
          venue: '',
          status: 'scheduled'
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, tournaments, teams]);

  if (!isOpen) return null;

  // Filter available teams by currently selected tournament
  const availableTeams = teams.filter(
    team => team.tournamentId === formData.tournamentId || team.tournament?.id === formData.tournamentId
  );

  const validate = () => {
    const newErrors = {};

    if (!formData.tournamentId) {
      newErrors.tournamentId = 'Tournament is required.';
    }

    if (!formData.homeTeamId) {
      newErrors.homeTeamId = 'Home Team is required.';
    }

    if (!formData.awayTeamId) {
      newErrors.awayTeamId = 'Away Team is required.';
    }

    if (formData.homeTeamId && formData.awayTeamId && formData.homeTeamId === formData.awayTeamId) {
      newErrors.awayTeamId = 'Home Team and Away Team cannot be the same.';
    }

    // Check if teams belong to selected tournament
    if (formData.homeTeamId && availableTeams.length > 0 && !availableTeams.some(t => t.id === formData.homeTeamId)) {
      newErrors.homeTeamId = 'Selected Home Team does not belong to the selected Tournament.';
    }

    if (formData.awayTeamId && availableTeams.length > 0 && !availableTeams.some(t => t.id === formData.awayTeamId)) {
      newErrors.awayTeamId = 'Selected Away Team does not belong to the selected Tournament.';
    }

    if (!formData.matchDate) {
      newErrors.matchDate = 'Match Date is required.';
    }

    if (!formData.kickoffTime) {
      newErrors.kickoffTime = 'Kickoff Time is required.';
    }

    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required.';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const [year, month, day] = formData.matchDate.split('-').map(Number);
      const [hours, minutes] = formData.kickoffTime.split(':').map(Number);
      const combinedDate = new Date(year, month - 1, day, hours, minutes);

      onSubmit({
        tournamentId: formData.tournamentId,
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        matchDate: combinedDate.toISOString(),
        venue: formData.venue.trim(),
        status: formData.status
      });
    }
  };

  const handleTournamentChange = (e) => {
    const newTournamentId = e.target.value;
    const newAvailableTeams = teams.filter(
      team => team.tournamentId === newTournamentId || team.tournament?.id === newTournamentId
    );

    setFormData(prev => ({
      ...prev,
      tournamentId: newTournamentId,
      homeTeamId: newAvailableTeams[0]?.id || '',
      awayTeamId: newAvailableTeams[1]?.id || ''
    }));

    if (errors.tournamentId) {
      setErrors(prev => ({ ...prev, tournamentId: null, homeTeamId: null, awayTeamId: null }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl w-full max-w-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Match' : 'Schedule New Match'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? 'Update fixture details, teams, and kickoff info.' : 'Set up a new fixture between two teams.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tournament Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-blue-500" />
              Tournament <span className="text-red-500">*</span>
            </label>
            <select
              name="tournamentId"
              value={formData.tournamentId}
              onChange={handleTournamentChange}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                errors.tournamentId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="" disabled>
                Select a Tournament
              </option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.tournamentId && <p className="text-xs text-red-500 mt-1">{errors.tournamentId}</p>}
            {tournaments.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No active tournaments found. Create a tournament first.
              </p>
            )}
          </div>

          {/* Home Team & Away Team Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Home Team <span className="text-red-500">*</span>
              </label>
              <select
                name="homeTeamId"
                value={formData.homeTeamId}
                onChange={handleChange}
                disabled={!formData.tournamentId}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.homeTeamId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                <option value="" disabled>
                  Select Home Team
                </option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
              {errors.homeTeamId && <p className="text-xs text-red-500 mt-1">{errors.homeTeamId}</p>}
              {formData.tournamentId && availableTeams.length < 2 && (
                <p className="text-xs text-amber-500 mt-1">
                  At least 2 teams are required in this tournament to schedule a match.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                Away Team <span className="text-red-500">*</span>
              </label>
              <select
                name="awayTeamId"
                value={formData.awayTeamId}
                onChange={handleChange}
                disabled={!formData.tournamentId}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.awayTeamId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50`}
              >
                <option value="" disabled>
                  Select Away Team
                </option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortName})
                  </option>
                ))}
              </select>
              {errors.awayTeamId && <p className="text-xs text-red-500 mt-1">{errors.awayTeamId}</p>}
            </div>
          </div>

          {/* Date & Kickoff Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Match Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="matchDate"
                value={formData.matchDate}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.matchDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.matchDate && <p className="text-xs text-red-500 mt-1">{errors.matchDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Kickoff Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="kickoffTime"
                value={formData.kickoffTime}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.kickoffTime ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.kickoffTime && <p className="text-xs text-red-500 mt-1">{errors.kickoffTime}</p>}
            </div>
          </div>

          {/* Venue & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Venue / Pitch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. Main Stadium Pitch 1"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.venue ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.venue && <p className="text-xs text-red-500 mt-1">{errors.venue}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Match Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.status ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize`}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status && <p className="text-xs text-red-500 mt-1">{errors.status}</p>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || tournaments.length === 0}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : initialData ? (
                'Save Changes'
              ) : (
                'Schedule Match'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
