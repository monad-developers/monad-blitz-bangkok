import sqlite3 from 'sqlite3';
import { logger } from '../utils/logger';
import { Player, Match, LeaderboardEntry } from '@monad-arena/shared';

export class Database {
  private db: sqlite3.Database | null = null;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './monad_arena.db';
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Failed to connect to database:', err);
          reject(err);
          return;
        }
        
        logger.info(`Connected to SQLite database: ${dbPath}`);
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Players table
      `CREATE TABLE IF NOT EXISTS players (
        address TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        elo INTEGER DEFAULT 1200,
        total_matches INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        win_streak INTEGER DEFAULT 0,
        max_win_streak INTEGER DEFAULT 0,
        badges TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Matches table
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        creator TEXT NOT NULL,
        opponent TEXT,
        mode TEXT NOT NULL,
        stake_amount TEXT NOT NULL,
        challenge_hash TEXT NOT NULL,
        status TEXT NOT NULL,
        winner TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        time_limit INTEGER NOT NULL,
        creator_submission TEXT,
        opponent_submission TEXT,
        creator_result TEXT,
        opponent_result TEXT
      )`,

      // ELO history table
      `CREATE TABLE IF NOT EXISTS elo_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_address TEXT NOT NULL,
        match_id TEXT NOT NULL,
        old_elo INTEGER NOT NULL,
        new_elo INTEGER NOT NULL,
        change_amount INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_address) REFERENCES players(address),
        FOREIGN KEY (match_id) REFERENCES matches(id)
      )`,

      // Submissions table  
      `CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id TEXT NOT NULL,
        player_address TEXT NOT NULL,
        code TEXT NOT NULL,
        language TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        result TEXT,
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (player_address) REFERENCES players(address)
      )`
    ];

    for (const sql of tables) {
      await this.runQuery(sql);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_players_elo ON players(elo DESC)',
      'CREATE INDEX IF NOT EXISTS idx_players_wins ON players(wins DESC)',
      'CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status)',
      'CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_elo_history_player ON elo_history(player_address)',
      'CREATE INDEX IF NOT EXISTS idx_submissions_match ON submissions(match_id)'
    ];

    for (const sql of indexes) {
      await this.runQuery(sql);
    }

    logger.info('Database tables created/verified');
  }

  private runQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database query error:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  private getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database query error:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  private allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database query error:', { sql, params, error: err.message });
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Player methods
  async createPlayer(address: string, username?: string): Promise<void> {
    await this.runQuery(
      'INSERT OR IGNORE INTO players (address, username) VALUES (?, ?)',
      [address, username]
    );
  }

  async getPlayer(address: string): Promise<Player | null> {
    const row = await this.getQuery(
      'SELECT * FROM players WHERE address = ?',
      [address]
    );

    if (!row) return null;

    return {
      address: row.address,
      username: row.username,
      elo: row.elo,
      totalMatches: row.total_matches,
      wins: row.wins,
      losses: row.losses,
      winStreak: row.win_streak,
      badges: JSON.parse(row.badges || '[]')
    };
  }

  async updatePlayerStats(
    address: string, 
    won: boolean, 
    eloChange: number
  ): Promise<void> {
    const sql = won 
      ? `UPDATE players SET 
          total_matches = total_matches + 1,
          wins = wins + 1,
          win_streak = win_streak + 1,
          max_win_streak = MAX(max_win_streak, win_streak + 1),
          elo = elo + ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE address = ?`
      : `UPDATE players SET 
          total_matches = total_matches + 1,
          losses = losses + 1,
          win_streak = 0,
          elo = elo + ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE address = ?`;

    await this.runQuery(sql, [eloChange, address]);
  }

  async getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
    const rows = await this.allQuery(
      `SELECT address, username, elo, total_matches, wins, losses, win_streak
       FROM players 
       WHERE total_matches > 0
       ORDER BY elo DESC, wins DESC 
       LIMIT ?`,
      [limit]
    );

    return rows.map((row, index) => ({
      rank: index + 1,
      player: {
        address: row.address,
        username: row.username,
        elo: row.elo,
        totalMatches: row.total_matches,
        wins: row.wins,
        losses: row.losses,
        winStreak: row.win_streak,
        badges: []
      }
    }));
  }

  // Match methods
  async saveMatch(match: Partial<Match>): Promise<void> {
    await this.runQuery(
      `INSERT OR REPLACE INTO matches 
       (id, creator, opponent, mode, stake_amount, challenge_hash, status, 
        winner, time_limit, resolved_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        match.id,
        match.creator,
        match.opponent,
        match.mode,
        match.stakeAmount,
        match.challengeHash,
        match.status,
        match.winner,
        match.timeLimit,
        match.resolvedAt
      ]
    );
  }

  async getMatch(matchId: string): Promise<Match | null> {
    const row = await this.getQuery(
      'SELECT * FROM matches WHERE id = ?',
      [matchId]
    );

    if (!row) return null;

    return {
      id: row.id,
      creator: row.creator,
      opponent: row.opponent,
      mode: row.mode,
      stakeAmount: row.stake_amount,
      challengeHash: row.challenge_hash,
      status: row.status,
      winner: row.winner,
      createdAt: new Date(row.created_at).getTime(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : undefined,
      timeLimit: row.time_limit
    };
  }

  async getPlayerMatches(playerAddress: string): Promise<Match[]> {
    const rows = await this.allQuery(
      `SELECT * FROM matches 
       WHERE creator = ? OR opponent = ?
       ORDER BY created_at DESC`,
      [playerAddress, playerAddress]
    );

    return rows.map(row => ({
      id: row.id,
      creator: row.creator,
      opponent: row.opponent,
      mode: row.mode,
      stakeAmount: row.stake_amount,
      challengeHash: row.challenge_hash,
      status: row.status,
      winner: row.winner,
      createdAt: new Date(row.created_at).getTime(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : undefined,
      timeLimit: row.time_limit
    }));
  }

  async recordEloChange(
    playerAddress: string,
    matchId: string,
    oldElo: number,
    newElo: number
  ): Promise<void> {
    await this.runQuery(
      `INSERT INTO elo_history 
       (player_address, match_id, old_elo, new_elo, change_amount) 
       VALUES (?, ?, ?, ?, ?)`,
      [playerAddress, matchId, oldElo, newElo, newElo - oldElo]
    );
  }

  async saveSubmission(
    matchId: string,
    playerAddress: string,
    code: string,
    language: string,
    result?: any
  ): Promise<void> {
    await this.runQuery(
      `INSERT INTO submissions 
       (match_id, player_address, code, language, result) 
       VALUES (?, ?, ?, ?, ?)`,
      [matchId, playerAddress, code, language, result ? JSON.stringify(result) : null]
    );
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            logger.error('Error closing database:', err);
          } else {
            logger.info('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}