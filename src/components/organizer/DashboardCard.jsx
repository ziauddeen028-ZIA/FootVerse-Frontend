import React from 'react';

export const DashboardCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }) => {
  return (
    <div className="bg-white dark:bg-[#141C2E] rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-semibold ${trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend > 0 ? '+' : ''}{trend}
          </span>
          <span className="ml-2 text-slate-500 dark:text-slate-400">
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
};
