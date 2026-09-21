import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  icon: Icon,
  placeholder = 'Select option',
  disabled = false,
  name,
  id,
  className = '',
  buttonClassName = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options to { value, label, disabled }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.id,
        label: opt.label !== undefined ? opt.label : opt.name || String(opt.value),
        disabled: Boolean(opt.disabled),
        ...opt,
      };
    }
    return {
      value: opt,
      label: String(opt),
      disabled: false,
    };
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optionValue) => {
    if (disabled) return;
    if (typeof onChange === 'function') {
      // Provide compatibility with both (value) => {} and (e) => {} handlers
      onChange(optionValue);
      if (name) {
        onChange({
          target: { name, value: optionValue },
          currentTarget: { name, value: optionValue },
        });
      }
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 border rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer text-left shadow-xs ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
            : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-slate-100/60 dark:hover:bg-slate-900/80'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
          <span className={`truncate ${!selectedOption && placeholder ? 'text-slate-400 dark:text-slate-500' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Options Menu */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className={`absolute left-0 top-full mt-1.5 w-full min-w-[170px] z-50 bg-white dark:bg-[#141C2E] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl shadow-xl py-1.5 overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto ${menuClassName}`}
        >
          {normalizedOptions.length === 0 ? (
            <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 text-center">
              No options available
            </div>
          ) : (
            normalizedOptions.map((option, idx) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value !== undefined ? String(option.value) : idx}
                  type="button"
                  role="option"
                  disabled={option.disabled}
                  aria-selected={isSelected}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 transition ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer ' +
                        (isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white')
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
export default CustomSelect;

