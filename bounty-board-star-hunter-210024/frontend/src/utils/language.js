export const translations = {
  en: {
    appTitle: 'Bounty Board - Star Hunter',
    appSubtitle: 'Player-Driven Bounty System for EVE Frontier',
    
    navbar: {
      home: 'Home',
      myBounties: 'My Bounties',
      rewards: 'Rewards',
    },
    
    sort: {
      title: 'Sort By',
      totalReward: 'Total Reward',
      perKillReward: 'Per Kill Reward',
      timeRemaining: 'Time Remaining',
    },
    
    language: {
      switch: 'Switch Language',
      en: 'English',
      zh: '中文',
    },
    
    createBounty: {
      title: 'Create Bounty',
      button: 'Create New Bounty',
      targetUID: 'Target UID',
      targetUIDPlaceholder: 'Enter target player UID',
      rewardAmount: 'Reward Amount',
      rewardAmountPlaceholder: 'Enter reward amount',
      tokenType: 'Token Type',
      killCount: 'Kill Count',
      killCountLabel: 'Required Kills',
      perKillReward: 'Per Kill Reward',
      timeframe: 'Time Frame',
      timeframeDays: 'Days',
      timeframeHint: 'Complete {count} kills within {days} days, {reward} per kill',
      futureKiller: 'Future Killer',
      futureKillerLabel: 'Set bounty for my future killer',
      futureKillerHint: 'Reward triggers automatically when you die',
      futureKillerUID: 'Future Murderer UID',
      futureKillerAutoGenerate: 'Auto-generate after death',
      remarks: 'Remarks',
      remarksPlaceholder: 'Describe target background, combat history, etc. (Max 64 chars)',
      remarksLimitEn: 'English: Max 64 characters',
      remarksLimitZh: 'Chinese: Max 20 characters',
      submit: 'Create Bounty',
      cancel: 'Cancel',
      minDays: 'Minimum 7 days',
      maxDays: 'Maximum 365 days',
      minKills: 'Minimum 1 kill',
      maxKills: 'Maximum 100 kills',
    },
    
    taskCard: {
      target: 'Target',
      reward: 'Reward',
      totalReward: 'Total',
      perKillReward: 'Per Kill',
      progress: 'Progress',
      killProgress: '{completed} / {total} Kills',
      deadline: 'Deadline',
      timeRemaining: 'Remaining',
      status: 'Status',
      statusActive: 'Active',
      statusCompleted: 'Claimed',
      statusExpired: 'Expired',
      futureKiller: 'Future Killer',
      remarks: 'Remarks',
      claimReward: 'Claim Reward',
      claimable: 'Claimable',
      simulateKill: 'Simulate Kill',
      createdBy: 'Created by',
      transferAddress: 'Transfer Address',
    },
    
    settlement: {
      title: 'Settlement Reward',
      completedKills: 'Completed {count} / {total} kills',
      rewardAvailable: 'Reward Available',
      claim: 'Claim Reward',
      claimed: 'Claimed',
      notEligible: 'Not Eligible',
      simulateKillSuccess: 'Kill recorded successfully',
      claimSuccess: 'Reward claimed successfully',
      transferredTo: 'Transferred to',
    },
    
    taskList: {
      title: 'Active Bounties',
      noTasks: 'No bounties available',
      loading: 'Loading...',
      loadMore: 'Load More',
      total: 'Total Bounties',
    },
    
    status: {
      active: 'Active',
      completed: 'Claimed',
      expired: 'Expired',
    },

    tokens: {
      EVE: 'EVE',
      FUEL: 'FUEL',
      SUI: 'SUI',
      USDT: 'USDT',
      USDC: 'USDC',
    },
    
    validation: {
      targetUIDRequired: 'Target UID is required',
      rewardAmountRequired: 'Reward amount is required',
      rewardAmountPositive: 'Reward must be positive',
      killCountRange: 'Kill count must be between 1 and 100',
      timeframeRange: 'Timeframe must be between 7 and 365 days',
      remarksLength: 'Remarks exceed maximum length',
    },
    
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      close: 'Close',
      submit: 'Submit',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Minutes',
      tokens: 'Tokens',
    },
  },
  
  zh: {
    appTitle: '赏金榜 - 星际猎人',
    appSubtitle: 'EVE Frontier 玩家驱动型赏金系统',
    
    navbar: {
      home: '首页',
      myBounties: '我的悬赏',
      rewards: '奖励',
    },
    
    sort: {
      title: '排序方式',
      totalReward: '总奖励',
      perKillReward: '单次击杀奖励',
      timeRemaining: '剩余时间',
    },
    
    language: {
      switch: '切换语言',
      en: 'English',
      zh: '中文',
    },
    
    createBounty: {
      title: '创建悬赏',
      button: '发布悬赏',
      targetUID: '目标 UID',
      targetUIDPlaceholder: '输入目标玩家 UID',
      rewardAmount: '奖励金额',
      rewardAmountPlaceholder: '输入奖励金额',
      tokenType: '代币类型',
      killCount: '击杀次数',
      killCountLabel: '所需击杀次数',
      perKillReward: '单次击杀奖励',
      timeframe: '时间范围',
      timeframeDays: '天',
      timeframeHint: '在 {days} 天内完成 {count} 次击杀，每次奖励 {reward}',
      futureKiller: '死亡反转悬赏',
      futureKillerLabel: '为未来杀死我的人设置悬赏',
      futureKillerHint: '死亡后自动触发奖励',
      futureKillerUID: '未来凶手 UID',
      futureKillerAutoGenerate: '死亡后自动生成',
      remarks: '备注',
      remarksPlaceholder: '描述目标背景、战斗历史等（最多 64 字符）',
      remarksLimitEn: '英文：最多 64 字符',
      remarksLimitZh: '中文：最多 20 字',
      submit: '创建悬赏',
      cancel: '取消',
      minDays: '最短 7 天',
      maxDays: '最长 365 天',
      minKills: '最少 1 次',
      maxKills: '最多 100 次',
    },
    
    taskCard: {
      target: '目标',
      reward: '奖励',
      totalReward: '总计',
      perKillReward: '单次',
      progress: '进度',
      killProgress: '{completed} / {total} 次击杀',
      deadline: '截止时间',
      timeRemaining: '剩余',
      status: '状态',
      statusActive: '进行中',
      statusCompleted: '已被领取',
      statusExpired: '已过期',
      futureKiller: '死亡反转',
      remarks: '备注',
      claimReward: '领取奖励',
      claimable: '可领取',
      simulateKill: '模拟击杀',
      createdBy: '发布者',
      transferAddress: '转账地址',
    },
    
    settlement: {
      title: '结算奖励',
      completedKills: '已完成 {count} / {total} 次击杀',
      rewardAvailable: '可领取奖励',
      claim: '领取奖励',
      claimed: '已领取',
      notEligible: '不符合条件',
      simulateKillSuccess: '击杀记录成功',
      claimSuccess: '奖励领取成功',
      transferredTo: '已转入',
    },
    
    taskList: {
      title: '活跃悬赏',
      noTasks: '暂无悬赏任务',
      loading: '加载中...',
      loadMore: '加载更多',
      total: '悬赏总数',
    },
    
    status: {
      active: '进行中',
      completed: '已被领取',
      expired: '已过期',
    },

    tokens: {
      EVE: 'EVE',
      FUEL: 'FUEL',
      SUI: 'SUI',
      USDT: 'USDT',
      USDC: 'USDC',
    },
    
    validation: {
      targetUIDRequired: '请输入目标 UID',
      rewardAmountRequired: '请输入奖励金额',
      rewardAmountPositive: '奖励金额必须大于 0',
      killCountRange: '击杀次数必须在 1-100 之间',
      timeframeRange: '时间范围必须在 7-365 天之间',
      remarksLength: '备注超出最大长度限制',
    },
    
    common: {
      confirm: '确认',
      cancel: '取消',
      close: '关闭',
      submit: '提交',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      view: '查看',
      search: '搜索',
      filter: '筛选',
      all: '全部',
      days: '天',
      hours: '小时',
      minutes: '分钟',
      tokens: '代币',
    },
  },
};

export const getTranslation = (lang, key) => {
  const keys = key.split('.');
  let value = translations[lang];
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return value || key;
};

export const formatMessage = (lang, key, params = {}) => {
  let message = getTranslation(lang, key);
  
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  
  return message;
};

export const validateLanguage = (lang) => {
  return ['en', 'zh'].includes(lang);
};

export const getDefaultLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  return browserLang.startsWith('zh') ? 'zh' : 'en';
};

export const saveLanguagePreference = (lang) => {
  if (validateLanguage(lang)) {
    localStorage.setItem('bounty_board_language', lang);
  }
};

export const loadLanguagePreference = () => {
  const saved = localStorage.getItem('bounty_board_language');
  return validateLanguage(saved) ? saved : getDefaultLanguage();
};

export const toggleLanguage = (currentLang) => {
  return currentLang === 'en' ? 'zh' : 'en';
};