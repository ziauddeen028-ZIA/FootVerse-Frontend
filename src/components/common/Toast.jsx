import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 bg-white dark:bg-[#141C2E] border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/40 animate-in slide-in-from-bottom-5">
      {type === 'success' ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-500" />
      )}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{message}</p>
      <button onClick={onClose} className="ml-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
