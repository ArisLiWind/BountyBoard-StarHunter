-- =====================================================
-- Bounty Board - Star Hunter Database Schema
-- SQLite Database Schema for Bounty System
-- =====================================================

-- 悬赏任务表
CREATE TABLE IF NOT EXISTS bounties (
    id TEXT PRIMARY KEY,
    target_uid TEXT NOT NULL,
    creator_uid TEXT NOT NULL,
    reward_amount REAL NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'EVE',
    token_address TEXT,
    kill_count INTEGER NOT NULL DEFAULT 1,
    completed_kills INTEGER NOT NULL DEFAULT 0,
    timeframe_days INTEGER NOT NULL DEFAULT 7,
    deadline INTEGER NOT NULL,
    is_future_killer INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    is_claimed INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CONSTRAINT chk_status CHECK (status IN ('active', 'completed', 'expired')),
    CONSTRAINT chk_token_type CHECK (token_type IN ('EVE', 'FUEL', 'SUI', 'USDT', 'USDC')),
    CONSTRAINT chk_kill_count CHECK (kill_count >= 1 AND kill_count <= 100),
    CONSTRAINT chk_timeframe CHECK (timeframe_days >= 7 AND timeframe_days <= 365)
);

CREATE INDEX IF NOT EXISTS idx_bounties_target_uid ON bounties(target_uid);
CREATE INDEX IF NOT EXISTS idx_bounties_creator_uid ON bounties(creator_uid);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_bounties_deadline ON bounties(deadline);
CREATE INDEX IF NOT EXISTS idx_bounties_is_future_killer ON bounties(is_future_killer);

-- 击杀记录表
CREATE TABLE IF NOT EXISTS kills (
    id TEXT PRIMARY KEY,
    bounty_id TEXT NOT NULL,
    killer_uid TEXT NOT NULL,
    kill_count INTEGER NOT NULL DEFAULT 1,
    reward_per_kill REAL NOT NULL,
    total_reward REAL NOT NULL,
    is_claimed INTEGER NOT NULL DEFAULT 0,
    claimed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
    CONSTRAINT chk_kill_count_positive CHECK (kill_count > 0)
);

CREATE INDEX IF NOT EXISTS idx_kills_bounty_id ON kills(bounty_id);
CREATE INDEX IF NOT EXISTS idx_kills_killer_uid ON kills(killer_uid);
CREATE INDEX IF NOT EXISTS idx_kills_is_claimed ON kills(is_claimed);
CREATE UNIQUE INDEX IF NOT EXISTS idx_kills_bounty_killer ON kills(bounty_id, killer_uid);

-- 奖励领取记录表
CREATE TABLE IF NOT EXISTS rewards (
    id TEXT PRIMARY KEY,
    bounty_id TEXT NOT NULL,
    killer_uid TEXT NOT NULL,
    kill_count INTEGER NOT NULL,
    reward_per_kill REAL NOT NULL,
    total_reward REAL NOT NULL,
    token_type TEXT NOT NULL,
    token_address TEXT NOT NULL,
    claimed_at INTEGER NOT NULL,
    FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE,
    CONSTRAINT chk_reward_positive CHECK (total_reward > 0)
);

CREATE INDEX IF NOT EXISTS idx_rewards_bounty_id ON rewards(bounty_id);
CREATE INDEX IF NOT EXISTS idx_rewards_killer_uid ON rewards(killer_uid);
CREATE INDEX IF NOT EXISTS idx_rewards_claimed_at ON rewards(claimed_at);

-- 玩家统计表（可选，用于排行榜等功能）
CREATE TABLE IF NOT EXISTS player_stats (
    player_uid TEXT PRIMARY KEY,
    total_bounties_created INTEGER NOT NULL DEFAULT 0,
    total_kills INTEGER NOT NULL DEFAULT 0,
    total_rewards_earned REAL NOT NULL DEFAULT 0,
    total_rewards_paid REAL NOT NULL DEFAULT 0,
    last_activity INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_stats_total_kills ON player_stats(total_kills DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_total_rewards_earned ON player_stats(total_rewards_earned DESC);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at INTEGER NOT NULL
);

-- 插入默认系统配置
INSERT OR IGNORE INTO system_config (key, value, description, updated_at) VALUES
('max_bounties', '300', '系统最大悬赏任务数量', strftime('%s', 'now') * 1000),
('min_reward_amount', '1', '最小奖励金额', strftime('%s', 'now') * 1000),
('max_reward_amount', '1000000', '最大奖励金额', strftime('%s', 'now') * 1000),
('min_timeframe_days', '7', '最短悬赏时间（天）', strftime('%s', 'now') * 1000),
('max_timeframe_days', '365', '最长悬赏时间（天）', strftime('%s', 'now') * 1000),
('supported_tokens', 'EVE,FUEL,SUI,USDT,USDC', '支持的代币类型', strftime('%s', 'now') * 1000);

-- 创建视图：活跃悬赏任务
CREATE VIEW IF NOT EXISTS active_bounties AS
SELECT 
    b.*,
    CASE 
        WHEN b.completed_kills >= b.kill_count THEN 'completed'
        WHEN b.deadline < (strftime('%s', 'now') * 1000) THEN 'expired'
        ELSE 'active'
    END AS current_status
FROM bounties b
WHERE b.status = 'active';

-- 创建视图：可领取奖励
CREATE VIEW IF NOT EXISTS claimable_rewards AS
SELECT 
    k.id,
    k.bounty_id,
    k.killer_uid,
    k.kill_count,
    k.reward_per_kill,
    k.total_reward,
    b.token_type,
    b.token_address,
    b.target_uid,
    b.status AS bounty_status
FROM kills k
INNER JOIN bounties b ON k.bounty_id = b.id
WHERE k.is_claimed = 0 
    AND k.kill_count > 0
    AND b.status IN ('active', 'completed');

-- =====================================================
-- 数据库版本信息
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL,
    description TEXT
);

INSERT OR IGNORE INTO schema_version (version, applied_at, description) VALUES
(1, strftime('%s', 'now') * 1000, '初始数据库结构');