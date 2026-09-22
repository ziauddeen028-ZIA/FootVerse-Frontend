import React from 'react';
import { SearchX } from 'lucide-react';

export const EmptyState = ({ title = "No results found", description = "Try adjusting your search or filters.", icon: Icon = SearchX, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-[#101C14] border border-slate-200/85 dark:border-[#1E3A29] rounded-2xl shadow-xs">
      <div className="w-16 h-16 bg-slate-100 dark:bg-[#16261C] rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-200/50 dark:border-[#1E3A29]/50">
        <Icon className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-5 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-green-600/20 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
