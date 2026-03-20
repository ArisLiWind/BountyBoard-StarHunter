import React from 'react';
import LanguageToggle from './LanguageToggle.jsx';
import { getTranslation } from '../utils/language.js';

const Navbar = ({ currentLang, onLanguageToggle, onCreateBounty }) => {
  const t = (key) => getTranslation(currentLang, key);

  return (
    <nav className="sticky top-0 z-40 bg-[#000000] border-b border-white/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center mb-6">
          <img 
            src="/resource-oss/tos-haisnap-resource/public/425820638779801600/images/abe1d3ca-3852-4c38-b18d-27c0b2320db7_1774025951562.jpg" 
            alt="EVE Frontier Logo" 
            className="h-20 w-20 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-20 h-20 border border-[#FF0000] items-center justify-center" style={{display: 'none'}}>
            <svg 
              className="w-12 h-12 text-[#FF0000]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-4">
          <h1 className="text-white font-mono font-bold tracking-wider text-4xl sm:text-5xl md:text-6xl uppercase mb-2">
            {currentLang === 'en' ? 'Bounty Board' : '赏金榜'}
          </h1>
          <div className="flex flex-col items-center gap-1 mb-2">
            <p className="text-white/70 font-mono text-sm font-light tracking-wide">
              星际猎杀
            </p>
            <p className="text-white/70 font-mono text-sm font-light tracking-wide">
              Star Hunter
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/50 font-mono text-xs font-light tracking-wider">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF0000]/30 to-[#FF0000]/50"></div>
            <span className="px-4 whitespace-nowrap uppercase">
              {t('appSubtitle')}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#FF0000]/30 to-[#FF0000]/50"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onCreateBounty}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF0000] text-black font-mono text-sm font-bold hover:bg-[#CC0000] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(255,0,0,0.6)]"
            aria-label={t('createBounty.button')}
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
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            <span className="font-light tracking-wider">
              {t('createBounty.button')}
            </span>
          </button>
          
          <LanguageToggle 
            currentLang={currentLang} 
            onToggle={onLanguageToggle} 
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;