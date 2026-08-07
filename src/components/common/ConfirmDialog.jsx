import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, isDestructive = false, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-[#141C2E] rounded-2xl w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4">
            {title}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-2 focus:ring-red-500/50' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-500/50'
            } disabled:opacity-70 flex items-center gap-2`}
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
