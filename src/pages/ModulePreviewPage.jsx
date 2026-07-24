import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Lock, Sparkles } from 'lucide-react';

export const ModulePreviewPage = ({ title, moduleName, phaseText }) => {
  return (
    <div className="max-w-xl mx-auto my-12 text-center glass-card rounded-3xl p-8 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center text-xl font-bold shadow-sm">
        <Lock className="w-6 h-6" />
      </div>

      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-800">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Scheduled for {phaseText}</span>
      </div>

      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
        {title} Module
      </h2>

      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
        {moduleName} will be built in the next requested phase as per project roadmap. All database schema tables and relationships for this module have already been prepared in <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">database/schema.sql</code>.
      </p>

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
