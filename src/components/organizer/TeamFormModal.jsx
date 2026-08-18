import React, { useState, useEffect } from 'react';
import { X, Shield, Palette, MapPin, Building, Trophy, AlertCircle } from 'lucide-react';

export const TeamFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  tournaments = [],
  existingTeams = [],
  isLoading = false,
  defaultTournamentId = ''
}) => {
  const [formData, setFormData] = useState({
    tournamentId: '',
    name: '',
    shortName: '',
    city: '',
    homeGround: '',
    primaryColor: '#1E50FF',
    secondaryColor: '#FFFFFF',
    logoUrl: ''
  });

  const [errors, setErrors] = useState({});

  const isTournamentLocked = Boolean(defaultTournamentId && !initialData);

  // Per-tournament capacity helpers
  const getTeamCount = (t) =>
    existingTeams.filter(tm => (tm.tournamentId || tm.tournament?.id) === t.id).length ||
    t.registeredTeamsCount ||
    0;
  const isTournamentFull = (t) => t.maxTeams !== null && getTeamCount(t) >= t.maxTeams;

  const selectedTournamentObj = tournaments.find(t => t.id === formData.tournamentId);
  const teamCountForSelected = selectedTournamentObj ? getTeamCount(selectedTournamentObj) : 0;
  const maxTeamsForSelected = selectedTournamentObj?.maxTeams || 16;
  // For create: block if full. For edit: only block if user picked a *different* full tournament.
  const currentTournamentId = initialData?.tournamentId || initialData?.tournament?.id;
  const isSelectedTournamentFull =
    Boolean(selectedTournamentObj) &&
    isTournamentFull(selectedTournamentObj) &&
    formData.tournamentId !== currentTournamentId;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          tournamentId: initialData.tournamentId || initialData.tournament?.id || defaultTournamentId || (tournaments[0]?.id || ''),
          name: initialData.name || '',
          shortName: initialData.shortName || '',
          city: initialData.city || '',
          homeGround: initialData.homeGround || '',
          primaryColor: initialData.primaryColor || '#1E50FF',
          secondaryColor: initialData.secondaryColor || '#FFFFFF',
          logoUrl: initialData.logoUrl || ''
        });
      } else {
        setFormData({
          tournamentId: defaultTournamentId || tournaments[0]?.id || '',
          name: '',
          shortName: '',
          city: '',
          homeGround: '',
          primaryColor: '#1E50FF',
          secondaryColor: '#FFFFFF',
          logoUrl: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, tournaments, defaultTournamentId]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.tournamentId) {
      newErrors.tournamentId = 'Please select a tournament for the team.';
    } else if (!initialData && isSelectedTournamentFull) {
      newErrors.tournamentId = `Tournament is full (${teamCountForSelected}/${maxTeamsForSelected} teams). No more teams can be registered.`;
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required.';
    }

    if (!formData.shortName.trim()) {
      newErrors.shortName = 'Short name is required.';
    } else if (formData.shortName.trim().length > 5) {
      newErrors.shortName = 'Short name must be 5 characters or fewer.';
    }

    // Check duplicate team name in selected tournament
    if (formData.tournamentId && formData.name.trim()) {
      const isDuplicate = existingTeams.some(
        team =>
          team.tournamentId === formData.tournamentId &&
          team.name.trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          team.id !== initialData?.id
      );

      if (isDuplicate) {
        newErrors.name = 'A team with this name already exists in the selected tournament.';
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
        name: formData.name.trim(),
        shortName: formData.shortName.trim().toUpperCase(),
        city: formData.city.trim() || null,
        homeGround: formData.homeGround.trim() || null,
        logoUrl: formData.logoUrl.trim() || null
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: name === 'shortName' ? value.toUpperCase() : value
    }));

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
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Team' : 'Create New Team'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? 'Update team information and colors.' : 'Register a new squad to a tournament.'}
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
              onChange={handleChange}
              disabled={isTournamentLocked}
              className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                errors.tournamentId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isTournamentLocked ? 'opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              <option value="" disabled>
                Select a Tournament
              </option>
              {tournaments.map(t => {
                const count = getTeamCount(t);
                const max = t.maxTeams || 16;
                const full = isTournamentFull(t);
                // Allow selecting the team's current tournament even when editing
                const isCurrentTournament = t.id === currentTournamentId;
                const disableOption = full && !isCurrentTournament;
                const label = full
                  ? `${t.name} (Full — ${count}/${max})`
                  : `${t.name} (${count}/${max})`;
                return (
                  <option key={t.id} value={t.id} disabled={disableOption}>
                    {label}
                  </option>
                );
              })}
            </select>
            {isTournamentLocked && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tournament selection is locked for this registration.
              </p>
            )}
            {isSelectedTournamentFull && (
              <div className="p-3 mt-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800/80 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Tournament is full ({teamCountForSelected}/{maxTeamsForSelected} teams). No more teams can be registered.</span>
              </div>
            )}
            {errors.tournamentId && <p className="text-xs text-red-500 mt-1">{errors.tournamentId}</p>}
            {tournaments.length === 0 && (
              <p className="text-xs text-amber-500 mt-1">
                No active tournaments found. Create a tournament first.
              </p>
            )}
          </div>

          {/* Basic Info: Name & Short Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Team Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Manchester City"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Short Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="shortName"
                maxLength={5}
                value={formData.shortName}
                onChange={handleChange}
                placeholder="e.g. MCI"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border ${
                  errors.shortName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                } rounded-xl text-slate-900 dark:text-white text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {errors.shortName && <p className="text-xs text-red-500 mt-1">{errors.shortName}</p>}
            </div>
          </div>

          {/* Location & Home Ground */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                City / Region
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Manchester"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Home Ground / Venue
              </label>
              <input
                type="text"
                name="homeGround"
                value={formData.homeGround}
                onChange={handleChange}
                placeholder="e.g. Etihad Stadium"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Colors Selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Team Colors
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Primary Color
                  </label>
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Secondary Color
                  </label>
                  <input
                    type="text"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              name="logoUrl"
              value={formData.logoUrl}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              disabled={isLoading || tournaments.length === 0 || isSelectedTournamentFull}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {initialData ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
