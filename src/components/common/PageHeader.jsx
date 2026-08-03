import React from 'react';

export const PageHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {ActionIcon && <ActionIcon className="w-5 h-5" />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
