const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.use(helmet({
  contentSecurityPolicy: false,
  frameguard: false
}));
app.use(cors());
app.use(express.json());

const publicDir = path.resolve(__dirname, '../frontend/public');
const distDir = path.resolve(__dirname, '../frontend/dist');
const publicPath = fs.existsSync(publicDir) ? publicDir : distDir;
app.use(express.static(publicPath));

const dbPath = path.resolve(__dirname, 'db/bounty_board.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Database connection error:', err);
  } else {
    logger.info('Connected to SQLite database');
  }
});

const memoryBounties = [];
const memoryKills = [];

function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'db/schema.sql');
  
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    statements.forEach((statement) => {
      if (statement.trim()) {
        db.run(statement, (err) => {
          if (err && !err.message.includes('already exists')) {
            logger.error('Schema initialization error:', err);
          }
        });
      }
    });
    
    logger.info('Database schema initialized');
  } else {
    db.serialize(() => {
      db.run(`
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
          updated_at INTEGER NOT NULL
        )
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          logger.error('Create bounties table error:', err);
        }
      });

      db.run(`
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
          FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          logger.error('Create kills table error:', err);
        }
      });

      db.run(`
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
          FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err && !err.message.includes('already exists')) {
          logger.error('Create rewards table error:', err);
        }
      });
    });
    
    logger.info('Database tables created');
  }
}

initDatabase();

const TOKEN_ADDRESSES = {
  EVE: '0xaa2b2c89ce420035cb7ec35201826a89881238e4dfd2208fde0c54f11c7a4ea0::EVE::EVE',
  FUEL: '0xffeca0a98bd75145a10e597cc5a02614cc651f3c1b8d79134bec40ff1fcefc91::fuel::FUEL',
  SUI: '0x2::sui::SUI',
  USDT: '0x700de8dea1aac1de7531e9d20fc2568b12d74369f91b7fad3abc1c4f40396e52::usdt::USDT',
  USDC: '0xb1b59612aa2ec15501474e40ab176cd298b881bddcf1e7afbb369cefc324614b::usdc::USDC'
};

app.post('/api/bounties', (req, res) => {
  const {
    targetUID,
    creatorUID,
    rewardAmount,
    tokenType = 'EVE',
    killCount = 1,
    timeframeDays = 7,
    isFutureKiller = false,
    remarks = ''
  } = req.body;

  if (!targetUID || !rewardAmount || !creatorUID) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: targetUID, creatorUID, rewardAmount' 
    });
  }

  const bountyId = uuidv4();
  const now = Date.now();
  const deadline = now + timeframeDays * 24 * 60 * 60 * 1000;
  const tokenAddress = TOKEN_ADDRESSES[tokenType] || '';

  const bounty = {
    id: bountyId,
    target_uid: targetUID,
    creator_uid: creatorUID,
    reward_amount: parseFloat(rewardAmount),
    token_type: tokenType,
    token_address: tokenAddress,
    kill_count: parseInt(killCount),
    completed_kills: 0,
    timeframe_days: parseInt(timeframeDays),
    deadline: deadline,
    is_future_killer: isFutureKiller ? 1 : 0,
    remarks: remarks,
    status: 'active',
    is_claimed: 0,
    created_at: now,
    updated_at: now
  };

  db.run(
    `INSERT INTO bounties (
      id, target_uid, creator_uid, reward_amount, token_type, token_address,
      kill_count, completed_kills, timeframe_days, deadline, is_future_killer,
      remarks, status, is_claimed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bounty.id, bounty.target_uid, bounty.creator_uid, bounty.reward_amount,
      bounty.token_type, bounty.token_address, bounty.kill_count, bounty.completed_kills,
      bounty.timeframe_days, bounty.deadline, bounty.is_future_killer, bounty.remarks,
      bounty.status, bounty.is_claimed, bounty.created_at, bounty.updated_at
    ],
    function(err) {
      if (err) {
        logger.error('Create bounty error:', err);
        memoryBounties.push(bounty);
        logger.warn('Bounty stored in memory fallback');
      }

      io.emit('bountyCreated', bounty);
      
      res.json({
        success: true,
        bounty: {
          ...bounty,
          isFutureKiller: bounty.is_future_killer === 1,
          isClaimed: bounty.is_claimed === 1
        }
      });
    }
  );
});

app.get('/api/bounties', (req, res) => {
  db.all('SELECT * FROM bounties ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      logger.error('Get bounties error:', err);
      return res.json({
        success: true,
        bounties: memoryBounties.map(b => ({
          ...b,
          isFutureKiller: b.is_future_killer === 1,
          isClaimed: b.is_claimed === 1
        }))
      });
    }

    const bounties = rows.map(row => ({
      id: row.id,
      targetUID: row.target_uid,
      creatorUID: row.creator_uid,
      rewardAmount: row.reward_amount,
      reward: row.reward_amount,
      tokenType: row.token_type,
      currency: row.token_type,
      tokenAddress: row.token_address,
      killCount: row.kill_count,
      completedKills: row.completed_kills,
      timeframeDays: row.timeframe_days,
      deadline: row.deadline,
      isFutureKiller: row.is_future_killer === 1,
      remarks: row.remarks,
      status: row.status,
      isClaimed: row.is_claimed === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      killers: {}
    }));

    db.all('SELECT * FROM kills WHERE is_claimed = 0', [], (err, killRows) => {
      if (!err && killRows) {
        killRows.forEach(kill => {
          const bounty = bounties.find(b => b.id === kill.bounty_id);
          if (bounty) {
            if (!bounty.killers[kill.killer_uid]) {
              bounty.killers[kill.killer_uid] = 0;
            }
            bounty.killers[kill.killer_uid] += kill.kill_count;
          }
        });
      }

      res.json({ success: true, bounties });
    });
  });
});

app.post('/api/kill', (req, res) => {
  const { bountyId, killerUID, targetUID } = req.body;

  if (!bountyId || !killerUID) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: bountyId, killerUID' 
    });
  }

  db.get('SELECT * FROM bounties WHERE id = ?', [bountyId], (err, bounty) => {
    if (err) {
      logger.error('Get bounty error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    if (bounty.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Bounty is not active' });
    }

    if (Date.now() > bounty.deadline) {
      db.run('UPDATE bounties SET status = ? WHERE id = ?', ['expired', bountyId]);
      return res.status(400).json({ success: false, error: 'Bounty expired' });
    }

    db.get(
      'SELECT * FROM kills WHERE bounty_id = ? AND killer_uid = ?',
      [bountyId, killerUID],
      (err, existingKill) => {
        if (err) {
          logger.error('Check existing kill error:', err);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        const now = Date.now();
        const rewardPerKill = bounty.reward_amount / bounty.kill_count;

        if (existingKill) {
          const newKillCount = existingKill.kill_count + 1;
          const newTotalReward = newKillCount * rewardPerKill;

          db.run(
            'UPDATE kills SET kill_count = ?, total_reward = ? WHERE id = ?',
            [newKillCount, newTotalReward, existingKill.id],
            (err) => {
              if (err) {
                logger.error('Update kill error:', err);
              }
            }
          );
        } else {
          const killId = uuidv4();
          db.run(
            `INSERT INTO kills (
              id, bounty_id, killer_uid, kill_count, reward_per_kill, 
              total_reward, is_claimed, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [killId, bountyId, killerUID, 1, rewardPerKill, rewardPerKill, 0, now],
            (err) => {
              if (err) {
                logger.error('Create kill error:', err);
              }
            }
          );
        }

        const newCompletedKills = bounty.completed_kills + 1;
        const newStatus = newCompletedKills >= bounty.kill_count ? 'completed' : 'active';

        db.run(
          'UPDATE bounties SET completed_kills = ?, status = ?, updated_at = ? WHERE id = ?',
          [newCompletedKills, newStatus, now, bountyId],
          (err) => {
            if (err) {
              logger.error('Update bounty error:', err);
            }

            const killEvent = {
              bountyId,
              killerUID,
              targetUID,
              completedKills: newCompletedKills,
              totalKills: bounty.kill_count,
              status: newStatus,
              rewardPerKill,
              canClaim: newStatus === 'completed'
            };

            io.emit('killEvent', killEvent);

            res.json({
              success: true,
              kill: killEvent
            });
          }
        );
      }
    );
  });
});

app.post('/api/bounties/:id/claim', (req, res) => {
  const bountyId = req.params.id;
  const { killerUID } = req.body;

  if (!killerUID) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required field: killerUID' 
    });
  }

  db.get('SELECT * FROM bounties WHERE id = ?', [bountyId], (err, bounty) => {
    if (err) {
      logger.error('Get bounty error:', err);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    if (!bounty) {
      return res.status(404).json({ success: false, error: 'Bounty not found' });
    }

    db.get(
      'SELECT * FROM kills WHERE bounty_id = ? AND killer_uid = ? AND is_claimed = 0',
      [bountyId, killerUID],
      (err, kill) => {
        if (err) {
          logger.error('Get kill error:', err);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        if (!kill) {
          return res.status(404).json({ 
            success: false, 
            error: 'No claimable reward found for this killer' 
          });
        }

        const now = Date.now();
        const rewardId = uuidv4();

        db.run(
          `INSERT INTO rewards (
            id, bounty_id, killer_uid, kill_count, reward_per_kill, 
            total_reward, token_type, token_address, claimed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            rewardId, bountyId, killerUID, kill.kill_count, kill.reward_per_kill,
            kill.total_reward, bounty.token_type, bounty.token_address, now
          ],
          (err) => {
            if (err) {
              logger.error('Create reward error:', err);
              return res.status(500).json({ success: false, error: 'Failed to record reward' });
            }

            db.run(
              'UPDATE kills SET is_claimed = 1, claimed_at = ? WHERE id = ?',
              [now, kill.id],
              (err) => {
                if (err) {
                  logger.error('Update kill claim status error:', err);
                }

                db.get(
                  'SELECT COUNT(*) as unclaimedCount FROM kills WHERE bounty_id = ? AND is_claimed = 0',
                  [bountyId],
                  (err, result) => {
                    if (!err && result.unclaimedCount === 0 && bounty.status === 'completed') {
                      db.run('UPDATE bounties SET is_claimed = 1 WHERE id = ?', [bountyId]);
                    }
                  }
                );

                const claimEvent = {
                  bountyId,
                  killerUID,
                  killCount: kill.kill_count,
                  rewardPerKill: kill.reward_per_kill,
                  totalReward: kill.total_reward,
                  tokenType: bounty.token_type,
                  tokenAddress: bounty.token_address,
                  claimedAt: now
                };

                io.emit('rewardClaimed', claimEvent);

                res.json({
                  success: true,
                  reward: claimEvent
                });
              }
            );
          }
        );
      }
    );
  });
});

io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });

  socket.on('error', (error) => {
    logger.error('Socket error:', error);
  });
});

app.get('*', (req, res) => {
  const filePath = path.join(publicPath, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
  } else {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});