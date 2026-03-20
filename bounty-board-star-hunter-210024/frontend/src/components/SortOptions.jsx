import React from 'react';
import { getTranslation } from '../utils/language.js';

const SortOptions = ({ currentSort, onSortChange, currentLang }) => {
  const t = (key) => getTranslation(currentLang, key);

  const sortOptions = [
    { value: 'totalReward', label: t('sort.totalReward') },
    { value: 'perKillReward', label: t('sort.perKillReward') },
    { value: 'timeRemaining', label: t('sort.timeRemaining') }
  ];

  return (
    <div className="flex items-center gap-2 bg-[#2A2A2A] border border-white/20 p-2">
      <div className="flex items-center gap-2 px-2 border-r border-white/10">
        <svg 
          className="w-4 h-4 text-white/50" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" 
          />
        </svg>
        <span className="text-white/70 text-xs font-mono font-light tracking-wider uppercase">
          {t('sort.title')}
        </span>
      </div>

      <div className="flex gap-1 flex-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`flex-1 px-3 py-2 text-xs font-mono font-light tracking-wide transition-all duration-300 border ${
              currentSort === option.value
                ? 'bg-[#FF0000] text-black border-[#FF0000] shadow-[0_0_10px_rgba(255,0,0,0.5)]'
                : 'bg-transparent text-white/70 border-white/10 hover:border-[#FF0000] hover:text-white hover:shadow-[0_0_5px_rgba(255,0,0,0.3)]'
            }`}
            aria-label={option.label}
            aria-pressed={currentSort === option.value}
          >
            <div className="flex items-center justify-center">
              <span className="whitespace-nowrap">{option.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortOptions;