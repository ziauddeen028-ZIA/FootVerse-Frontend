import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Trophy, Shield, Hash, Target, Mail, Image as ImageIcon } from 'lucide-react';

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

export const PlayerFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  tournaments = [],
  teams = [],
  existingPlayers = [],
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    tournamentId: '',
    teamId: '',
    fullName: '',
    jerseyNumber: '',
    position: 'Midfielder',
    email: '',
    avatarUrl: '',
    bio: ''
  });

  const [errors, setErrors] = useState({});

  // Filter teams based on selected tournament
  const availableTeams = useMemo(() => {
    if (!formData.tournamentId) return teams;
    return teams.filter(
      t => t.tournamentId === formData.tournamentId || t.tournament?.id === formData.tournamentId
    );
  }, [teams, formData.tournamentId]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const tId = initialData.team?.tournamentId || initialData.team?.tournament?.id || (tournaments[0]?.id || '');
        const tmId = initialData.teamId || initialData.team?.id || '';

        setFormData({
          tournamentId: tId,
          teamId: tmId,
          fullName: initialData.player?.fullName || '',
          jerseyNumber: initialData.jerseyNumber !== undefined ? String(initialData.jerseyNumber) : '',
          position: initialData.position || initialData.player?.preferredPosition || 'Midfielder',
          email: initialData.player?.email && !initialData.player?.email.includes('@footverse.local') ? initialData.player.email : '',
          avatarUrl: initialData.player?.avatarUrl || '',
          bio: initialData.player?.bio || ''
        });
      } else {
        const defaultTours = tournaments[0]?.id || '';
        const defaultTeams = teams.filter(
          t => t.tournamentId === defaultTours || t.tournament?.id === defaultTours
        );

        setFormData({
          tournamentId: defaultTours,
          teamId: defaultTeams[0]?.id || (teams[0]?.id || ''),
          fullName: '',
          jerseyNumber: '',
          position: 'Midfielder',
          email: '',
          avatarUrl: '',
          bio: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, tournaments, teams]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Player full name is required.';
    }

    if (!formData.teamId) {
      newErrors.teamId = 'Please select a team for the player.';
    }

    if (!formData.jerseyNumber || String(formData.jerseyNumber).trim() === '') {
      newErrors.jerseyNumber = 'Jersey number is required.';
    } else {
      const num = Number(formData.jerseyNumber);
      if (!Number.isInteger(num) || num < 1 || num > 99) {
        newErrors.jerseyNumber = 'Jersey number must be between 1 and 99.';
      }
    }

    // Check duplicate jersey number in selected team
    if (formData.teamId && formData.jerseyNumber) {
      const parsedNum = Number(formData.jerseyNumber);
      const isDuplicate = existingPlayers.some(
        p =>
          (p.teamId === formData.teamId || p.team?.id === formData.teamId) &&
          Number(p.jerseyNumber) === parsedNum &&
          p.id !== initialData?.id
      );

      if (isDuplicate) {
        newErrors.jerseyNumber = `Jersey #${parsedNum} is already taken in this team.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        fullName: formData.fullName.trim(),
        jerseyNumber: Number(formData.jerseyNumber),
        email: formData.email.trim() || null,
        avatarUrl: formData.avatarUrl.trim() || null,
        bio: formData.bio.trim() || null
      });
    }
  };

  const handleTournamentChange = (e) => {
    const newTournamentId = e.target.value;
    const matchingTeams = teams.filter(
      t => t.tournamentId === newTournamentId || t.tournament?.id === newTournamentId
    );

    setFormData(prev => ({
      ...prev,
      tournamentId: newTournamentId,
      teamId: matchingTeams[0]?.id || ''
    }));

    if (errors.tournamentId) setErrors(prev => ({ ...prev, tournamentId: null }));
    if (errors.teamId) setErrors(prev => ({ ...prev, teamId: null }));
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Player' : 'Register New Player'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? 'Update player info and roster assignment.' : 'Add a squad member to a team.'}
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
          {/* Tournament & Team Cascading Selects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-blue-500" />
                Tournament <span className="text-red-500">*</span>
              </label>
              <select
                name="tournamentId"
                value={formData.tournamentId}
                onChange={handleTournamentChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select Tournament
                </option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                Team <span className="text-red-500">*</span>
              </label>
              <select
                name="teamId"
                value={formData.teamId}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.teamId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="" disabled>
                  {availableTeams.length > 0 ? 'Select Team' : 'No Teams in this Tournament'}
                </option>
                {availableTeams.map(tm => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name} ({tm.shortName})
                  </option>
                ))}
              </select>
              {errors.teamId && <p className="text-xs text-red-500 mt-1">{errors.teamId}</p>}
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Erling Haaland"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="player@example.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Jersey Number & Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
                Jersey Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="jerseyNumber"
                min={1}
                max={99}
                value={formData.jerseyNumber}
                onChange={handleChange}
                placeholder="e.g. 9"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.jerseyNumber ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.jerseyNumber && <p className="text-xs text-red-500 mt-1">{errors.jerseyNumber}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Position
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Avatar / Photo URL (Optional)
            </label>
            <input
              type="url"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bio / Age / Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Bio / Notes (Optional)
            </label>
            <textarea
              name="bio"
              rows={2}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Player bio, age, or preferred foot..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Form Actions */}
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
              disabled={isLoading || availableTeams.length === 0}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {initialData ? 'Update Player' : 'Register Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
