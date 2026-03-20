import { v4 as uuidv4 } from 'uuid';
import { getDeadlineTimestamp, isExpired } from '../utils/dateUtils.js';

const MAX_BOUNTIES = 300;
const TOKEN_TYPES = ['EVE', 'FUEL', 'SUI', 'USDT', 'USDC'];

// 币种合约地址映射表
const TOKEN_ADDRESSES = {
  EVE: '0xaa2b2c89ce420035cb7ec35201826a89881238e4dfd2208fde0c54f11c7a4ea0::EVE::EVE',
  FUEL: '0xffeca0a98bd75145a10e597cc5a02614cc651f3c1b8d79134bec40ff1fcefc91::fuel::FUEL',
  SUI: '0x2::sui::SUI',
  USDT: '0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT',
  USDC: '0xb1b59612aa2ec15501474e40ab176cd298b881bddcf1e7afbb369cefc324614b::usdc::USDC'
};

class BountyStorage {
  constructor() {
    this.bounties = [];
    this.playerKills = {};
    this.currentPlayerUID = 'PLAYER_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    this.initializeMockData();
  }

  initializeMockData() {
    const mockBounties = [
      {
        id: uuidv4(),
        targetUID: 'TARGET_X7K9P2',
        creatorUID: 'CREATOR_A1B2C3',
        rewardAmount: 50000,
        reward: 50000,
        tokenType: 'EVE',
        currency: 'EVE',
        tokenAddress: TOKEN_ADDRESSES.EVE,
        killCount: 10,
        completedKills: 3,
        timeframeDays: 30,
        deadline: getDeadlineTimestamp(25),
        isFutureKiller: false,
        remarks: 'High-value pirate target. Known for ambush tactics in null-sec.',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        status: 'active',
        killers: {},
        isClaimed: false
      },
      {
        id: uuidv4(),
        targetUID: 'TARGET_M4N8Q5',
        creatorUID: 'CREATOR_D4E5F6',
        rewardAmount: 100000,
        reward: 100000,
        tokenType: 'FUEL',
        currency: 'FUEL',
        tokenAddress: TOKEN_ADDRESSES.FUEL,
        killCount: 1,
        completedKills: 0,
        timeframeDays: 7,
        deadline: getDeadlineTimestamp(6),
        isFutureKiller: false,
        remarks: 'Corporate spy. Eliminate on sight.',
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
        status: 'active',
        killers: {},
        isClaimed: false
      },
      // 已完成且当前玩家可领取奖励的任务 (100,000 SUI)
      {
        id: uuidv4(),
        targetUID: 'TARGET_CLAIM_ME',
        creatorUID: 'CREATOR_REWARD_MASTER',
        rewardAmount: 100000,
        reward: 100000,
        tokenType: 'SUI',
        currency: 'SUI',
        tokenAddress: TOKEN_ADDRESSES.SUI,
        killCount: 1,
        completedKills: 1,
        timeframeDays: 7,
        deadline: getDeadlineTimestamp(5),
        isFutureKiller: false,
        remarks: 'Urgent elimination complete. Reward ready for pickup immediately.',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        status: 'active',
        killers: {}, 
        isClaimed: false
      },
      {
        id: uuidv4(),
        targetUID: 'TARGET_R3S7T1',
        creatorUID: 'CREATOR_G7H8I9',
        rewardAmount: 75000,
        reward: 75000,
        tokenType: 'USDT',
        currency: 'USDT',
        tokenAddress: TOKEN_ADDRESSES.USDT,
        killCount: 5,
        completedKills: 5,
        timeframeDays: 14,
        deadline: getDeadlineTimestamp(-2),
        isFutureKiller: false,
        remarks: 'Revenge bounty. Betrayed alliance trust.',
        createdAt: Date.now() - 16 * 24 * 60 * 60 * 1000,
        status: 'active',
        killers: { 'KILLER_ABC123': 5 },
        isClaimed: false
      },
      {
        id: uuidv4(),
        targetUID: 'FUTURE_KILLER_PLACEHOLDER',
        creatorUID: this.currentPlayerUID,
        rewardAmount: 25000,
        reward: 25000,
        tokenType: 'USDC',
        currency: 'USDC',
        tokenAddress: TOKEN_ADDRESSES.USDC,
        killCount: 1,
        completedKills: 0,
        timeframeDays: 365,
        deadline: getDeadlineTimestamp(365),
        isFutureKiller: true,
        remarks: 'Insurance policy. Revenge from beyond.',
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        status: 'active',
        killers: {},
        isClaimed: false
      },
      {
        id: uuidv4(),
        targetUID: 'TARGET_W8Y2Z5',
        creatorUID: 'CREATOR_J1K2L3',
        rewardAmount: 15000,
        reward: 15000,
        tokenType: 'EVE',
        currency: 'EVE',
        tokenAddress: TOKEN_ADDRESSES.EVE,
        killCount: 20,
        completedKills: 8,
        timeframeDays: 60,
        deadline: getDeadlineTimestamp(-5),
        isFutureKiller: false,
        remarks: 'Training target for new pilots.',
        createdAt: Date.now() - 65 * 24 * 60 * 60 * 1000,
        status: 'expired',
        killers: { 'KILLER_DEF456': 5, 'KILLER_GHI789': 3 },
        isClaimed: false
      }
    ];

    this.bounties = mockBounties;
    
    // 模拟当前玩家已经击杀了那个可领取的任务目标 (SUI 任务)
    const claimableTaskIndex = this.bounties.findIndex(b => b.targetUID === 'TARGET_CLAIM_ME');
    if (claimableTaskIndex !== -1) {
      this.bounties[claimableTaskIndex].killers[this.currentPlayerUID] = 1;
      if (!this.playerKills[this.currentPlayerUID]) {
        this.playerKills[this.currentPlayerUID] = {};
      }
      this.playerKills[this.currentPlayerUID][this.bounties[claimableTaskIndex].id] = 1;
    }

    this.updateAllStatuses();
  }

  createBounty(bountyData) {
    if (this.bounties.length >= MAX_BOUNTIES) {
      this.cleanOldBounties();
    }

    const tokenType = bountyData.tokenType || 'EVE';
    const newBounty = {
      id: uuidv4(),
      targetUID: bountyData.isFutureKiller ? 'FUTURE_KILLER_PLACEHOLDER' : bountyData.targetUID,
      creatorUID: this.currentPlayerUID,
      rewardAmount: parseFloat(bountyData.rewardAmount),
      reward: parseFloat(bountyData.rewardAmount),
      tokenType: tokenType,
      currency: tokenType,
      tokenAddress: TOKEN_ADDRESSES[tokenType] || '',
      killCount: parseInt(bountyData.killCount),
      completedKills: 0,
      timeframeDays: parseInt(bountyData.timeframeDays),
      deadline: getDeadlineTimestamp(bountyData.timeframeDays),
      isFutureKiller: bountyData.isFutureKiller || false,
      remarks: bountyData.remarks || '',
      createdAt: Date.now(),
      status: 'active',
      killers: {},
      isClaimed: false
    };

    this.bounties.unshift(newBounty);
    return newBounty;
  }

  simulateKill(bountyId, killerUID = null) {
    const bounty = this.bounties.find(b => b.id === bountyId);
    if (!bounty || bounty.status !== 'active') return null;

    if (isExpired(bounty.deadline)) {
      bounty.status = 'expired';
      return null;
    }

    const killer = killerUID || this.currentPlayerUID;
    
    if (!bounty.killers[killer]) {
      bounty.killers[killer] = 0;
    }
    
    bounty.killers[killer]++;
    bounty.completedKills++;

    if (bounty.completedKills >= bounty.killCount) {
      bounty.status = 'completed';
    }

    if (!this.playerKills[killer]) {
      this.playerKills[killer] = {};
    }
    if (!this.playerKills[killer][bountyId]) {
      this.playerKills[killer][bountyId] = 0;
    }
    this.playerKills[killer][bountyId]++;

    return {
      bounty,
      killer,
      killCount: bounty.killers[killer],
      rewardPerKill: bounty.rewardAmount / bounty.killCount
    };
  }

  claimReward(bountyId, killerUID = null) {
    const killer = killerUID || this.currentPlayerUID;
    const bounty = this.bounties.find(b => b.id === bountyId);
    
    if (!bounty || !bounty.killers[killer]) return null;

    const killCount = bounty.killers[killer];
    const rewardPerKill = bounty.rewardAmount / bounty.killCount;
    const totalReward = killCount * rewardPerKill;

    delete bounty.killers[killer];
    
    if (Object.keys(bounty.killers).length === 0 && bounty.status === 'completed') {
      bounty.isClaimed = true;
    }
    
    if (this.playerKills[killer] && this.playerKills[killer][bountyId]) {
      delete this.playerKills[killer][bountyId];
    }

    return {
      bountyId,
      killer,
      killCount,
      rewardPerKill,
      totalReward,
      tokenType: bounty.tokenType,
      tokenAddress: bounty.tokenAddress
    };
  }

  getClaimableRewards(playerUID = null) {
    const player = playerUID || this.currentPlayerUID;
    const claimable = [];

    this.bounties.forEach(bounty => {
      if (bounty.killers[player] && bounty.killers[player] > 0) {
        const killCount = bounty.killers[player];
        const rewardPerKill = bounty.rewardAmount / bounty.killCount;
        claimable.push({
          bountyId: bounty.id,
          targetUID: bounty.targetUID,
          killCount,
          rewardPerKill,
          totalReward: killCount * rewardPerKill,
          tokenType: bounty.tokenType,
          tokenAddress: bounty.tokenAddress,
          status: bounty.status
        });
      }
    });

    return claimable;
  }

  getAllBounties() {
    this.updateAllStatuses();
    return this.bounties.filter(b => !b.isFutureKiller || b.creatorUID === this.currentPlayerUID);
  }

  getBountyById(id) {
    return this.bounties.find(b => b.id === id);
  }

  updateAllStatuses() {
    this.bounties.forEach(bounty => {
      if (bounty.status === 'active') {
        if (bounty.completedKills >= bounty.killCount) {
          bounty.status = 'completed';
        } else if (isExpired(bounty.deadline)) {
          bounty.status = 'expired';
        }
      }
    });
  }

  sortBounties(sortType = 'totalReward') {
    const sorted = [...this.bounties];
    
    switch (sortType) {
      case 'totalReward':
        return sorted.sort((a, b) => b.rewardAmount - a.rewardAmount);
      case 'perKillReward':
        return sorted.sort((a, b) => {
          const aPerKill = a.rewardAmount / a.killCount;
          const bPerKill = b.rewardAmount / b.killCount;
          return bPerKill - aPerKill;
        });
      case 'timeRemaining':
        return sorted.sort((a, b) => {
          const aRemaining = a.deadline - Date.now();
          const bRemaining = b.deadline - Date.now();
          return aRemaining - bRemaining;
        });
      default:
        return sorted;
    }
  }

  cleanOldBounties() {
    const expiredBounties = this.bounties
      .filter(b => b.status === 'expired' || b.status === 'completed')
      .sort((a, b) => a.createdAt - b.createdAt);

    if (expiredBounties.length > 50) {
      const toRemove = expiredBounties.slice(0, 50);
      toRemove.forEach(bounty => {
        const index = this.bounties.findIndex(b => b.id === bounty.id);
        if (index > -1) {
          this.bounties.splice(index, 1);
        }
      });
    }
  }

  triggerFutureKiller(victimUID, killerUID) {
    const futureKillerBounty = this.bounties.find(
      b => b.isFutureKiller && b.creatorUID === victimUID && b.targetUID === 'FUTURE_KILLER_PLACEHOLDER'
    );

    if (futureKillerBounty) {
      futureKillerBounty.targetUID = killerUID;
      return futureKillerBounty;
    }
    return null;
  }

  getCurrentPlayerUID() {
    return this.currentPlayerUID;
  }

  getTokenTypes() {
    return TOKEN_TYPES;
  }

  getTokenAddresses() {
    return TOKEN_ADDRESSES;
  }
}

const bountyStorage = new BountyStorage();

export default bountyStorage;

export {
  TOKEN_TYPES,
  TOKEN_ADDRESSES,
  MAX_BOUNTIES
};