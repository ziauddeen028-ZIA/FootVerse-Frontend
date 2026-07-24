import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage = () => {
  return (
    <div className="max-w-md mx-auto my-16 px-4 text-center">
      <div className="saas-card rounded-3xl p-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center text-2xl shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white">
          Access Restricted
        </h2>

        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
          You do not have the required role permissions to view this section of the FootVerse Arena.
        </p>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
