import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import TaskList from './components/TaskList.jsx';
import CreateBountyModal from './components/CreateBountyModal.jsx';
import { getTranslation, loadLanguagePreference, saveLanguagePreference, toggleLanguage } from './utils/language.js';
import './styles/global.css';

const App = () => {
  const [currentLang, setCurrentLang] = useState('en');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const savedLang = loadLanguagePreference();
    setCurrentLang(savedLang);
  }, []);

  const handleLanguageToggle = () => {
    const newLang = toggleLanguage(currentLang);
    setCurrentLang(newLang);
    saveLanguagePreference(newLang);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBountyCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const t = (key) => getTranslation(currentLang, key);

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden">
      <div 
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'url(https://hpi-hub.tos-cn-beijing.volces.com/static/people/ai-generated-8358718_1280.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className="relative z-10">
        <Navbar 
          currentLang={currentLang}
          onLanguageToggle={handleLanguageToggle}
          onCreateBounty={handleOpenModal}
        />

        <main className="relative">
          <TaskList 
            currentLang={currentLang}
            refreshTrigger={refreshTrigger}
          />
        </main>

        <button
          onClick={handleOpenModal}
          className="fixed bottom-8 right-8 z-30 w-16 h-16 btn-primary flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 group"
          aria-label={t('createBounty.button')}
        >
          <svg 
            className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" 
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
        </button>

        <CreateBountyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleBountyCreated}
          currentLang={currentLang}
        />
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF0000] to-transparent opacity-30 pointer-events-none"></div>
    </div>
  );
};

export default App;