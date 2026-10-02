import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaSearch, FaChevronDown, FaTimes, FaCheck } from 'react-icons/fa';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  avatarUrl?: string;
  avatarInitial?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  label,
  required = false,
  disabled = false,
  className = '',
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(query)) ||
        (opt.badge && opt.badge.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="label">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Hidden input to support HTML form validation */}
      <input
        type="text"
        value={value}
        required={required}
        onChange={() => {}}
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
        onInvalid={(e) => {
          e.preventDefault();
          setIsOpen(true);
        }}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between text-left rounded-xl border bg-white px-3.5 py-2.5 text-sm transition-all focus:outline-none ${
          isOpen
            ? 'border-teal-500 ring-2 ring-teal-500/20'
            : error
            ? 'border-red-400 ring-1 ring-red-200'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {/* Avatar thumbnail or initial */}
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden relative">
                <span>{selectedOption.avatarInitial || selectedOption.label.charAt(0)}</span>
                {selectedOption.avatarUrl && (
                  <img
                    src={selectedOption.avatarUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div className="truncate">
                <span className="font-medium text-slate-800">{selectedOption.label}</span>
                {selectedOption.subLabel && (
                  <span className="text-xs text-slate-400 ml-1.5 font-normal">
                    ({selectedOption.subLabel})
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
          <FaChevronDown
            className={`text-xs text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-teal-600' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-xs text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400">
                No matching results found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 text-teal-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden relative">
                        <span>{option.avatarInitial || option.label.charAt(0)}</span>
                        {option.avatarUrl && (
                          <img
                            src={option.avatarUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>

                      {/* Label & Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{option.label}</span>
                          {option.badge && (
                            <span className="rounded-full bg-teal-100 text-teal-800 px-2 py-0.5 text-[10px] font-medium capitalize shrink-0">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        {option.subLabel && (
                          <p className="text-[11px] text-slate-400 truncate font-normal">
                            {option.subLabel}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <FaCheck className="text-teal-600 text-xs ml-2 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
