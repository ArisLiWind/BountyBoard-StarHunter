import React, { useState, useEffect, useCallback } from 'react';
import TaskCard from './TaskCard.jsx';
import SortOptions from './SortOptions.jsx';
import { getTranslation } from '../utils/language.js';
import bountyStorage from '../data/mockData.js';

const TaskList = ({ currentLang, refreshTrigger }) => {
  const t = (key) => getTranslation(currentLang, key);
  
  const [bounties, setBounties] = useState([]);
  const [sortType, setSortType] = useState('totalReward');
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const currentPlayerUID = bountyStorage.getCurrentPlayerUID();

  const loadBounties = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      let allBounties = bountyStorage.getAllBounties();
      
      // 如果是按剩余时间排序，只显示未完成的任务
      if (sortType === 'timeRemaining') {
        allBounties = allBounties.filter(bounty => 
          bounty.status !== 'completed' && bounty.status !== 'expired'
        );
      }
      
      const sorted = bountyStorage.sortBounties(sortType);
      
      // 再次过滤排序后的结果（确保一致性）
      const filtered = sortType === 'timeRemaining'
        ? sorted.filter(bounty => bounty.status !== 'completed' && bounty.status !== 'expired')
        : sorted;
      
      setBounties(filtered);
      setIsLoading(false);
    }, 300);
  }, [sortType]);

  useEffect(() => {
    loadBounties();
  }, [loadBounties, refreshTrigger]);

  const handleSortChange = (newSortType) => {
    setSortType(newSortType);
    setDisplayCount(10);
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 10, bounties.length));
      setIsLoading(false);
    }, 300);
  };

  const handleUpdate = () => {
    loadBounties();
  };

  const displayedBounties = bounties.slice(0, displayCount);
  const hasMore = displayCount < bounties.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-mono font-light tracking-wider text-white uppercase mb-2">
              {t('taskList.title')}
            </h1>
            <p className="text-white/50 font-mono text-xs font-light tracking-wide">
              {t('taskList.total')}: {bounties.length}
            </p>
          </div>
        </div>

        <SortOptions 
          currentSort={sortType}
          onSortChange={handleSortChange}
          currentLang={currentLang}
        />
      </div>

      {isLoading && displayedBounties.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-[#FF0000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/50 font-mono text-sm font-light tracking-wide">
              {t('taskList.loading')}
            </p>
          </div>
        </div>
      ) : displayedBounties.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center p-8 bg-[#2A2A2A] border border-white/20">
            <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-white/70 font-mono text-sm font-light tracking-wide">
              {t('taskList.noTasks')}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {displayedBounties.map((bounty, index) => (
              <TaskCard
                key={bounty.id}
                bounty={bounty}
                currentLang={currentLang}
                onUpdate={handleUpdate}
                currentPlayerUID={currentPlayerUID}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-8 py-3 btn-secondary font-mono text-sm font-light tracking-wider uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('taskList.loading')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{t('taskList.loadMore')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskList;