import React from 'react';
import { SearchX } from 'lucide-react';

export const EmptyState = ({ title = "No results found", description = "Try adjusting your search or filters.", icon: Icon = SearchX, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#141C2E] border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
