import React, { useState, useEffect } from 'react';
import { X, Trophy, Users, GitMerge, Zap, Settings, CheckCircle2, Info } from 'lucide-react';

export const TournamentFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    maxTeams: 16,
    entryFee: 0,
    format: 'knockout',
    status: 'draft',
    // Dynamic format configuration fields
    numberOfGroups: 4,
    teamsPerGroup: 4,
    qualifyingTeamsPerGroup: 2,
    eliminationType: 'single',
    includeThirdPlace: true,
    seedingMethod: 'seeded',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          slug: initialData.slug || '',
          location: initialData.location || '',
          startDate: initialData.startDate ? initialData.startDate.split('T')[0] : '',
          endDate: initialData.endDate ? initialData.endDate.split('T')[0] : '',
          description: initialData.description || '',
          maxTeams: initialData.maxTeams || 16,
          entryFee: initialData.entryFee || 0,
          format: initialData.format || 'knockout',
          status: initialData.status || 'draft',
          numberOfGroups: initialData.numberOfGroups || 4,
          teamsPerGroup: initialData.teamsPerGroup || 4,
          qualifyingTeamsPerGroup: initialData.qualifyingTeamsPerGroup || 2,
          eliminationType: initialData.eliminationType || 'single',
          includeThirdPlace: initialData.includeThirdPlace !== undefined ? initialData.includeThirdPlace : true,
          seedingMethod: initialData.seedingMethod || 'seeded',
        });
      } else {
        setFormData({
          name: '',
          slug: '',
          location: '',
          startDate: '',
          endDate: '',
          description: '',
          maxTeams: 16,
          entryFee: 0,
          format: 'knockout',
          status: 'draft',
          numberOfGroups: 4,
          teamsPerGroup: 4,
          qualifyingTeamsPerGroup: 2,
          eliminationType: 'single',
          includeThirdPlace: true,
          seedingMethod: 'seeded',
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Helper to dynamically calculate bracket round names from team count
  const calculateBracketDetails = (teamsCount) => {
    const num = Number(teamsCount);
    if (!num || isNaN(num) || num < 2) {
      return { roundName: 'Invalid Team Count', totalRounds: 0 };
    }

    const totalRounds = Math.ceil(Math.log2(num));
    let roundName = '';

    if (num === 2) roundName = 'Finals';
    else if (num === 4) roundName = 'Semi-Finals (4 Teams)';
    else if (num === 8) roundName = 'Quarter-Finals (8 Teams)';
    else if (num === 16) roundName = 'Round of 16 (16 Teams)';
    else if (num === 32) roundName = 'Round of 32 (32 Teams)';
    else if (num === 64) roundName = 'Round of 64 (64 Teams)';
    else if (num === 128) roundName = 'Round of 128 (128 Teams)';
    else roundName = `${num}-Team Bracket`;

    return { roundName, totalRounds };
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tournament Name is required.';
    if (!formData.location.trim()) newErrors.location = 'Location is required.';

    if (formData.format === 'league' || formData.format === 'knockout') {
      if (!formData.maxTeams || Number(formData.maxTeams) < 2) {
        newErrors.maxTeams = 'Max Teams must be at least 2.';
      }
    }

    if (formData.format === 'group_stage' || formData.format === 'hybrid') {
      if (!formData.numberOfGroups || Number(formData.numberOfGroups) < 1) {
        newErrors.numberOfGroups = 'At least 1 group is required.';
      }
      if (!formData.teamsPerGroup || Number(formData.teamsPerGroup) < 2) {
        newErrors.teamsPerGroup = 'At least 2 teams per group required.';
      }
      if (!formData.qualifyingTeamsPerGroup || Number(formData.qualifyingTeamsPerGroup) < 1) {
        newErrors.qualifyingTeamsPerGroup = 'At least 1 qualifying team required.';
      } else if (Number(formData.qualifyingTeamsPerGroup) >= Number(formData.teamsPerGroup)) {
        newErrors.qualifyingTeamsPerGroup = 'Qualifying teams must be less than teams per group.';
      }
    }

    // Auto-generate slug if missing
    if (!formData.slug.trim() && formData.name.trim()) {
      formData.slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = 'End Date cannot be before Start Date.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      let computedMaxTeams = Number(formData.maxTeams);
      if (formData.format === 'group_stage' || formData.format === 'hybrid') {
        computedMaxTeams = Number(formData.numberOfGroups) * Number(formData.teamsPerGroup);
      }

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        location: formData.location.trim(),
        startDate: formData.startDate ? formData.startDate : null,
        endDate: formData.endDate ? formData.endDate : null,
        description: formData.description ? formData.description.trim() : '',
        format: formData.format,
        status: formData.status,
        maxTeams: computedMaxTeams,
        entryFee: Number(formData.entryFee) || 0,
        // Format specific settings
        numberOfGroups: (formData.format === 'group_stage' || formData.format === 'hybrid') ? Number(formData.numberOfGroups) : undefined,
        teamsPerGroup: (formData.format === 'group_stage' || formData.format === 'hybrid') ? Number(formData.teamsPerGroup) : undefined,
        qualifyingTeamsPerGroup: (formData.format === 'group_stage' || formData.format === 'hybrid') ? Number(formData.qualifyingTeamsPerGroup) : undefined,
        eliminationType: (formData.format === 'knockout' || formData.format === 'hybrid') ? formData.eliminationType : undefined,
        includeThirdPlace: (formData.format === 'knockout' || formData.format === 'hybrid') ? Boolean(formData.includeThirdPlace) : undefined,
        seedingMethod: (formData.format === 'knockout' || formData.format === 'hybrid') ? formData.seedingMethod : undefined,
      };

      onSubmit(payload);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFormatSelect = (formatKey) => {
    setFormData(prev => {
      const updated = { ...prev, format: formatKey };
      if (formatKey === 'group_stage' || formatKey === 'hybrid') {
        updated.maxTeams = prev.numberOfGroups * prev.teamsPerGroup;
      }
      return updated;
    });
    setErrors(prev => ({
      ...prev,
      maxTeams: null,
      numberOfGroups: null,
      teamsPerGroup: null,
      qualifyingTeamsPerGroup: null
    }));
  };

  const formatOptions = [
    {
      id: 'league',
      name: 'League',
      icon: Trophy,
      badge: 'Round Robin',
      description: 'Single division standings table format.',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'group_stage',
      name: 'Group Stage',
      icon: Users,
      badge: 'Groups + Points',
      description: 'Divided into groups with points table.',
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'knockout',
      name: 'Knockout',
      icon: GitMerge,
      badge: 'Elimination Bracket',
      description: 'Tournament tree elimination bracket.',
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      icon: Zap,
      badge: 'Groups → Knockout',
      description: 'Group stage followed by knockout bracket.',
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
    }
  ];

  // Calculations for preview feedback
  const totalGroupTeams = Number(formData.numberOfGroups) * Number(formData.teamsPerGroup);
  const totalAdvancingTeams = Number(formData.numberOfGroups) * Number(formData.qualifyingTeamsPerGroup);
  const knockoutBracketInfo = calculateBracketDetails(formData.format === 'hybrid' ? totalAdvancingTeams : formData.maxTeams);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-[#141C2E] rounded-2xl w-full max-w-3xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-full">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Tournament' : 'Create Tournament'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dynamically configure tournament format and structure.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <form id="tournament-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* General Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tournament Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g. Champions Cup 2026"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if empty"
                />
              </div>
            </div>

            {/* Location & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.location ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g. National Arena"
                />
                {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.endDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
              </div>
            </div>

            {/* ─── TOURNAMENT FORMAT SELECTOR ────────────────────────────────────── */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tournament Format *
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {formatOptions.map(opt => {
                  const IconComponent = opt.icon;
                  const isSelected = formData.format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleFormatSelect(opt.id)}
                      className={`relative text-left p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-2 rounded-lg ${opt.color}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{opt.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                          {opt.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── DYNAMIC FORMAT CONFIGURATION FIELDS ───────────────────────── */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <Settings className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {formData.format.replace('_', ' ')} Dynamic Configuration
                </h4>
              </div>

              {/* 1. LEAGUE CONFIG */}
              {formData.format === 'league' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max Teams *</label>
                    <input
                      type="number"
                      name="maxTeams"
                      min="2"
                      max="128"
                      value={formData.maxTeams}
                      onChange={handleChange}
                      className={`w-full px-3.5 py-2 rounded-xl border ${
                        errors.maxTeams ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                      } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.maxTeams && <p className="text-xs text-red-500">{errors.maxTeams}</p>}
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Total teams competing in single standings table.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. GROUP STAGE CONFIG */}
              {formData.format === 'group_stage' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Groups *</label>
                      <input
                        type="number"
                        name="numberOfGroups"
                        min="1"
                        max="32"
                        value={formData.numberOfGroups}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2 rounded-xl border ${
                          errors.numberOfGroups ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.numberOfGroups && <p className="text-xs text-red-500">{errors.numberOfGroups}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Teams Per Group *</label>
                      <input
                        type="number"
                        name="teamsPerGroup"
                        min="2"
                        max="32"
                        value={formData.teamsPerGroup}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2 rounded-xl border ${
                          errors.teamsPerGroup ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.teamsPerGroup && <p className="text-xs text-red-500">{errors.teamsPerGroup}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Qualifying Teams / Group *</label>
                      <input
                        type="number"
                        name="qualifyingTeamsPerGroup"
                        min="1"
                        max={formData.teamsPerGroup ? Number(formData.teamsPerGroup) - 1 : 4}
                        value={formData.qualifyingTeamsPerGroup}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2 rounded-xl border ${
                          errors.qualifyingTeamsPerGroup ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.qualifyingTeamsPerGroup && <p className="text-xs text-red-500">{errors.qualifyingTeamsPerGroup}</p>}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-4 justify-between items-center">
                    <div>Total Group Stage Teams: <span className="font-bold text-slate-900 dark:text-white">{totalGroupTeams}</span></div>
                    <div>Qualifying Teams: <span className="font-bold text-blue-600 dark:text-blue-400">{totalAdvancingTeams}</span></div>
                  </div>
                </div>
              )}

              {/* 3. KNOCKOUT CONFIG */}
              {formData.format === 'knockout' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Participating Teams *</label>
                      <input
                        type="number"
                        name="maxTeams"
                        min="2"
                        max="128"
                        value={formData.maxTeams}
                        onChange={handleChange}
                        className={`w-full px-3.5 py-2 rounded-xl border ${
                          errors.maxTeams ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />
                      {errors.maxTeams && <p className="text-xs text-red-500">{errors.maxTeams}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Elimination Type</label>
                      <select
                        name="eliminationType"
                        value={formData.eliminationType}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="single">Single Elimination</option>
                        <option value="double">Double Elimination</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Seeding Method</label>
                      <select
                        name="seedingMethod"
                        value={formData.seedingMethod}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="seeded">Seeded Bracket</option>
                        <option value="random">Random Bracket Draw</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2.5 pt-4">
                      <input
                        type="checkbox"
                        id="includeThirdPlace"
                        name="includeThirdPlace"
                        checked={formData.includeThirdPlace}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                      />
                      <label htmlFor="includeThirdPlace" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Include 3rd Place Match
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Bracket Round Info */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200/80 dark:border-purple-900/30 text-xs flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Info className="w-4 h-4 shrink-0" />
                    <div>
                      Calculated Bracket Starting Round: <span className="font-bold">{knockoutBracketInfo.roundName}</span> ({knockoutBracketInfo.totalRounds} Rounds Total)
                    </div>
                  </div>
                </div>
              )}

              {/* 4. HYBRID CONFIG */}
              {formData.format === 'hybrid' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phase 1: Group Stage Setup
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Number of Groups *</label>
                        <input
                          type="number"
                          name="numberOfGroups"
                          min="1"
                          max="32"
                          value={formData.numberOfGroups}
                          onChange={handleChange}
                          className={`w-full px-3.5 py-2 rounded-xl border ${
                            errors.numberOfGroups ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.numberOfGroups && <p className="text-xs text-red-500">{errors.numberOfGroups}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Teams Per Group *</label>
                        <input
                          type="number"
                          name="teamsPerGroup"
                          min="2"
                          max="32"
                          value={formData.teamsPerGroup}
                          onChange={handleChange}
                          className={`w-full px-3.5 py-2 rounded-xl border ${
                            errors.teamsPerGroup ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.teamsPerGroup && <p className="text-xs text-red-500">{errors.teamsPerGroup}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Qualifying Teams / Group *</label>
                        <input
                          type="number"
                          name="qualifyingTeamsPerGroup"
                          min="1"
                          max={formData.teamsPerGroup ? Number(formData.teamsPerGroup) - 1 : 4}
                          value={formData.qualifyingTeamsPerGroup}
                          onChange={handleChange}
                          className={`w-full px-3.5 py-2 rounded-xl border ${
                            errors.qualifyingTeamsPerGroup ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        {errors.qualifyingTeamsPerGroup && <p className="text-xs text-red-500">{errors.qualifyingTeamsPerGroup}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Phase 2: Knockout Bracket Setup
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Elimination Type</label>
                        <select
                          name="eliminationType"
                          value={formData.eliminationType}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="single">Single Elimination</option>
                          <option value="double">Double Elimination</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bracket Seeding</label>
                        <select
                          name="seedingMethod"
                          value={formData.seedingMethod}
                          onChange={handleChange}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="seeded">Group Winners vs Runners-Up</option>
                          <option value="random">Random Draw</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Calculated Hybrid Knockout Size Info */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200/80 dark:border-emerald-900/30 text-xs flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <Info className="w-4 h-4 shrink-0" />
                    <div>
                      Total Group Stage Capacity: <span className="font-bold text-slate-900 dark:text-white">{totalGroupTeams} Teams</span>. Calculated Knockout Size: <span className="font-bold">{totalAdvancingTeams} Qualified Teams</span> → <span className="font-bold">{knockoutBracketInfo.roundName}</span>.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entry Fee & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entry Fee ($)</label>
                <input
                  type="number"
                  name="entryFee"
                  min="0"
                  step="0.01"
                  value={formData.entryFee}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Tournament details..."
              ></textarea>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="tournament-form"
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {initialData ? 'Save Changes' : 'Create Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
};
