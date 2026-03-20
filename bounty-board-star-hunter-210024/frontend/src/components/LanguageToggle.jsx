import React from 'react';
import { getTranslation } from '../utils/language.js';

const LanguageToggle = ({ currentLang, onToggle }) => {
  const t = (key) => getTranslation(currentLang, key);

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-4 py-2 bg-[#2A2A2A] border border-white/20 hover:border-[#FF0000] transition-all duration-300 text-white font-mono text-sm hover:shadow-[0_0_10px_rgba(255,0,0,0.3)]"
      aria-label={t('language.switch')}
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
        />
      </svg>
      <span className="font-light tracking-wider">
        {currentLang === 'en' ? 'EN' : '中文'}
      </span>
      <svg 
        className="w-3 h-3 opacity-50" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
        />
      </svg>
    </button>
  );
};

export default LanguageToggle;