import React, { useState, useEffect } from 'react';
import { getTranslation, formatMessage } from '../utils/language.js';
import { formatRemainingTime, getStatusByDeadline, formatDate } from '../utils/dateUtils.js';
import bountyStorage from '../data/mockData.js';
import io from 'socket.io-client';

// 币种地址映射表
const TOKEN_ADDRESSES = {
  EVE: '0xaa2b2c89ce420035cb7ec35201826a89881238e4dfd2208fde0c54f11c7a4ea0::EVE::EVE',
  FUEL: '0xffeca0a98bd75145a10e597cc5a02614cc651f3c1b8d79134bec40ff1fcefc91::fuel::FUEL',
  SUI: '0x2::sui::SUI',
  USDT: '0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT',
  USDC: '0xb1b59612aa2ec15501474e40ab176cd298b881bddcf1e7afbb369cefc324614b::usdc::USDC'
};

const TaskCard = ({ bounty, currentLang, onUpdate, currentPlayerUID }) => {
  const t = (key) => getTranslation(currentLang, key);
  const fm = (key, params) => formatMessage(currentLang, key, params);
  
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    amount: '',
    currency: '',
    address: ''
  });
  const [localBounty, setLocalBounty] = useState(bounty);

  // Socket.IO 连接和监听
  useEffect(() => {
    const socket = io(window.location.origin);

    // 监听击杀事件
    socket.on('killEvent', (killData) => {
      if (killData.bountyId === localBounty.id) {
        setLocalBounty(prev => ({
          ...prev,
          completedKills: killData.completedKills,
          status: killData.status,
          killers: {
            ...prev.killers,
            [killData.killerUID]: (prev.killers[killData.killerUID] || 0) + 1
          }
        }));
        onUpdate && onUpdate();
      }
    });

    // 监听奖励领取事件
    socket.on('rewardClaimed', (claimData) => {
      if (claimData.bountyId === localBounty.id) {
        setLocalBounty(prev => {
          const newKillers = { ...prev.killers };
          delete newKillers[claimData.killerUID];
          
          const allClaimed = Object.keys(newKillers).length === 0 && prev.status === 'completed';
          
          return {
            ...prev,
            killers: newKillers,
            isClaimed: allClaimed
          };
        });
        onUpdate && onUpdate();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [localBounty.id, onUpdate]);

  // 同步外部bounty变化
  useEffect(() => {
    setLocalBounty(bounty);
  }, [bounty]);

  const status = getStatusByDeadline(localBounty.deadline, localBounty.completedKills, localBounty.killCount);
  const perKillReward = (localBounty.rewardAmount / localBounty.killCount).toFixed(2);
  const remainingTime = formatRemainingTime(localBounty.deadline, currentLang);
  const progressPercent = (localBounty.completedKills / localBounty.killCount) * 100;

  const playerKills = localBounty.killers[currentPlayerUID] || 0;
  const canClaim = playerKills > 0 && status === 'completed' && !localBounty.isClaimed;
  const claimableReward = (playerKills * perKillReward).toFixed(2);

  const handleClaimReward = async () => {
    if (!localBounty.reward && !localBounty.rewardAmount || !localBounty.tokenType) {
      console.error('任务数据缺失奖励金额或币种！');
      return;
    }

    try {
      // 调用后端API领取奖励
      const response = await fetch(`${window.location.origin}/api/bounties/${localBounty.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ killerUID: currentPlayerUID })
      });

      if (!response.ok) {
        throw new Error('Failed to claim reward');
      }

      const result = await response.json();
      
      if (result.success && result.reward) {
        const formattedAmount = result.reward.totalReward.toLocaleString('en-US', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 2 
        });
        
        const tokenAddress = TOKEN_ADDRESSES[result.reward.tokenType] || 'Unknown Address';

        setNotificationData({
          amount: formattedAmount,
          currency: result.reward.tokenType,
          address: tokenAddress
        });
        setShowNotification(true);
        
        setTimeout(() => setShowNotification(false), 5000);
        
        // 更新本地状态
        setLocalBounty(prev => {
          const newKillers = { ...prev.killers };
          delete newKillers[currentPlayerUID];
          return {
            ...prev,
            killers: newKillers,
            isClaimed: Object.keys(newKillers).length === 0 && prev.status === 'completed'
          };
        });
        
        onUpdate && onUpdate();
      }
    } catch (error) {
      console.error('领取奖励失败:', error);
      // 降级处理：使用本地存储
      const result = bountyStorage.claimReward(localBounty.id, currentPlayerUID);
      if (result) {
        const formattedAmount = result.totalReward.toLocaleString('en-US', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 2 
        });
        
        const tokenAddress = TOKEN_ADDRESSES[result.tokenType] || 'Unknown Address';

        setNotificationData({
          amount: formattedAmount,
          currency: result.tokenType,
          address: tokenAddress
        });
        setShowNotification(true);
        
        setTimeout(() => setShowNotification(false), 5000);
        onUpdate && onUpdate();
      }
    }
  };

  const getStatusColor = () => {
    if (localBounty.isClaimed) return 'text-[#888888]';
    switch (status) {
      case 'completed': return 'text-[#00AAFF]';
      case 'expired': return 'text-[#888888]';
      default: return 'text-[#00FF00]';
    }
  };

  const getStatusText = () => {
    if (bounty.isClaimed) return t('taskCard.statusCompleted');
    switch (status) {
      case 'completed': return t('taskCard.statusActive');
      case 'expired': return t('taskCard.statusExpired');
      default: return t('taskCard.statusActive');
    }
  };

  const isOwnBounty = localBounty.creatorUID === currentPlayerUID;
  const isFutureKillerVisible = localBounty.isFutureKiller && isOwnBounty;

  if (localBounty.isFutureKiller && !isOwnBounty) {
    return null;
  }

  const randomRemarks = [
    '愤怒复仇型：这家伙竟然炸掉了我们的基地，杀了三名队友！绝不能放过他，奖金高达 5000！',
    '黑色幽默型：看他偷走了燃料又溜掉，就像现实里的"搬空大盗"，干掉他，你的钱包也能厚起来。',
    '夸张戏剧型：他把整个红星联盟的仓库当游乐场狂欢，炸得烟雾缭绕！快去猎杀他，成为传奇！',
    '冷静分析型：目标 UID 0342，经多次袭击造成联盟资源损失 72%，击杀后奖励分配清晰，请按策略行动。',
    '俏皮挑衅型：哎呀呀，这位"星际小霸王"又跑出来撒野啦！敢抓住他的人，奖金都归你啦，手慢无哦！',
    '可恶的幽灵舰长，把我们基地炸得跟周末大扫除一样干净！谁能抓住他，赏金就是你的！',
    '这个人像现实里的快递小哥一样神出鬼没，偷走了我们所有资源，还没留收据！务必让他付账！',
    '星际掠夺者狂欢节开始了，他把我们的仓库当成嘉年华游乐场！消灭他，奖金等你拿！',
    '狂暴的火焰猎手，不仅击沉旗舰，还像现实里玩过山车一样把我们吓得直冒冷汗！去教训他吧，赏金丰厚！'
  ];

  return (
    <div className="relative">
      <div 
        className={`bg-[#2A2A2A] border border-white/20 p-4 card-hover animate-slide-in relative overflow-hidden transition-all duration-300 ${
          localBounty.isClaimed ? 'opacity-50 grayscale pointer-events-none' : ''
        }`}
        style={{
          backgroundImage: 'url(https://hpi-hub.tos-cn-beijing.volces.com/static/people/ai-generated-8358718_1280.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/85 to-black/80"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧：目标信息 + 状态 */}
            <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white/50 font-mono text-xs font-light tracking-wider uppercase">
                    {t('taskCard.target')}
                  </span>
                  {isFutureKillerVisible && (
                    <span className="px-2 py-0.5 bg-[#FF0000]/20 border border-[#FF0000]/50 text-[#FF0000] font-mono text-xs font-light">
                      {t('taskCard.futureKiller')}
                    </span>
                  )}
                </div>
                <div className="font-mono text-base font-light tracking-wider text-white truncate">
                  {localBounty.targetUID === 'FUTURE_KILLER_PLACEHOLDER' 
                    ? t('createBounty.futureKillerAutoGenerate')
                    : localBounty.targetUID
                  }
                </div>
              </div>
              <div className={`px-3 py-1 border font-mono text-xs font-light tracking-wider uppercase ${getStatusColor()} border-current whitespace-nowrap`}>
                {getStatusText()}
              </div>
            </div>

            {/* 中间：奖励信息 */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <div>
                <div className="text-white/50 font-mono text-xs font-light tracking-wider uppercase mb-1">
                  {t('taskCard.totalReward')}
                </div>
                <div className="text-[#FF0000] font-mono text-lg font-bold tracking-wide whitespace-nowrap">
                  {localBounty.rewardAmount.toLocaleString()}
                  <span className="text-sm ml-2 font-light">{localBounty.tokenType}</span>
                </div>
              </div>

              <div>
                <div className="text-white/50 font-mono text-xs font-light tracking-wider uppercase mb-1">
                  {t('taskCard.perKillReward')}
                </div>
                <div className="text-white font-mono text-lg font-light tracking-wide whitespace-nowrap">
                  {perKillReward}
                  <span className="text-sm ml-2 text-white/50">{localBounty.tokenType}</span>
                </div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/50 font-mono text-xs font-light tracking-wider uppercase">
                  {t('taskCard.progress')}
                </span>
                <span className="font-mono text-xs font-light text-white">
                  {fm('taskCard.killProgress', { 
                    completed: localBounty.completedKills, 
                    total: localBounty.killCount 
                  })}
                </span>
              </div>
              <div className="w-full h-2 bg-black/50 border border-white/10 relative overflow-hidden">
                <div 
                  className="h-full bg-[#FF0000] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* 时间信息 */}
            <div className="flex items-center gap-6 flex-shrink-0">
              <div>
                <div className="text-white/50 font-mono text-xs font-light tracking-wider uppercase mb-1">
                  {t('taskCard.deadline')}
                </div>
                <div className="font-mono text-xs text-white/70 whitespace-nowrap">
                  {formatDate(localBounty.deadline)}
                </div>
              </div>

              <div>
                <div className="text-white/50 font-mono text-xs font-light tracking-wider uppercase mb-1">
                  {t('taskCard.timeRemaining')}
                </div>
                <div className={`font-mono text-xs font-light whitespace-nowrap ${
                  status === 'expired' ? 'text-[#888888]' : 'text-[#00FF00]'
                }`}>
                  {remainingTime}
                </div>
              </div>
            </div>

            {/* 右侧：领取按钮 */}
            {canClaim && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <div>
                  <div className="text-[#00FF00] font-mono text-xs font-light tracking-wider uppercase mb-1">
                    {t('taskCard.claimable')}
                  </div>
                  <div className="font-mono text-sm text-white/70 whitespace-nowrap">
                    {claimableReward} {localBounty.tokenType}
                  </div>
                </div>
                <button
                  onClick={handleClaimReward}
                  className="px-6 py-2 bg-[#FF0000] text-white font-mono text-sm font-bold tracking-wider uppercase hover:bg-[#CC0000] transition-all duration-300 shadow-lg hover:shadow-2xl whitespace-nowrap"
                >
                  {t('taskCard.claimReward')}
                </button>
              </div>
            )}
          </div>

          {/* 备注和发布者信息（可折叠显示） */}
          {(localBounty.remarks || localBounty.creatorUID) && (
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-xs">
              {localBounty.remarks && (
                <div className="flex-1 min-w-0">
                  <span className="text-white/50 font-mono font-light tracking-wider uppercase mr-2">
                    {t('taskCard.remarks')}:
                  </span>
                  <span className="font-mono text-white/70 font-light">
                    {localBounty.remarks || randomRemarks[Math.floor(Math.random() * randomRemarks.length)]}
                  </span>
                </div>
              )}
              <div className="text-white/30 font-mono font-light whitespace-nowrap">
                {t('taskCard.createdBy')}: {localBounty.creatorUID}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-slide-in">
          <div className="bg-[#000000] border-2 border-[#FFD700] px-8 py-8 max-w-md w-full shadow-[0_0_40px_rgba(255,215,0,0.6)] flex flex-col items-center gap-6 relative">
            <button 
              onClick={() => setShowNotification(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-16 h-16 rounded-full bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30">
              <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="text-center w-full">
              <span className="font-mono text-base text-white/90 block mb-4">
                {currentLang === 'zh' ? '奖励已入账' : 'Reward Credited'}
              </span>
              
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-[#FFD700] font-mono text-5xl font-bold tracking-tight shadow-[0_0_20px_rgba(255,215,0,0.8)]">
                  {notificationData.amount}
                </span>
                <span className="text-[#FFD700] font-mono text-2xl font-bold">
                  {notificationData.currency}
                </span>
              </div>

              <div className="bg-[#2A2A2A]/50 border border-white/10 p-4 rounded text-left">
                <div className="text-white/50 font-mono text-xs uppercase mb-2">
                  {currentLang === 'zh' ? '转账地址' : 'Transfer Address'}
                </div>
                <div className="font-mono text-xs text-[#00FF00] break-all leading-relaxed">
                  {notificationData.address}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowNotification(false)}
              className="w-full px-6 py-3 bg-[#FFD700] text-black font-mono font-bold tracking-wider uppercase hover:bg-[#E5C100] transition-all duration-300"
            >
              {currentLang === 'zh' ? '确认' : 'CONFIRM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;