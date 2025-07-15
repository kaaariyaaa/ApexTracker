import Database from 'better-sqlite3';
import * as path from 'path';

export interface LiveUpdate {
  messageId: string;
  channelId: string;
  guildId: string;
}

export class LiveUpdateManager {
  private db: Database.Database;
  private static instance: LiveUpdateManager;
  private static readonly DB_FILE_PATH = path.join(__dirname, '../../live-updates.db');

  private constructor() {
    this.db = new Database(LiveUpdateManager.DB_FILE_PATH);
    this.initDatabase();
  }

  public static getInstance(): LiveUpdateManager {
    if (!LiveUpdateManager.instance) {
      LiveUpdateManager.instance = new LiveUpdateManager();
    }
    return LiveUpdateManager.instance;
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS live_updates (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL
      )
    `);
  }

  public addLiveUpdate(messageId: string, channelId: string, guildId: string): void {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO live_updates (message_id, channel_id, guild_id) VALUES (?, ?, ?)');
    stmt.run(messageId, channelId, guildId);
  }

  public removeLiveUpdate(messageId: string): void {
    const stmt = this.db.prepare('DELETE FROM live_updates WHERE message_id = ?');
    stmt.run(messageId);
  }

  public getLiveUpdatesByGuild(guildId: string): LiveUpdate[] {
    const updates = this.db.prepare('SELECT message_id AS messageId, channel_id AS channelId, guild_id AS guildId FROM live_updates WHERE guild_id = ?').all(guildId) as LiveUpdate[];
    return updates;
  }

  public getLiveUpdate(messageId: string): LiveUpdate | null {
    const update = this.db.prepare('SELECT message_id AS messageId, channel_id AS channelId, guild_id AS guildId FROM live_updates WHERE message_id = ?').get(messageId) as LiveUpdate | undefined;
    return update || null;
  }

  public getLiveUpdatesByChannel(channelId: string): LiveUpdate[] {
    const updates = this.db.prepare('SELECT message_id AS messageId, channel_id AS channelId, guild_id AS guildId FROM live_updates WHERE channel_id = ?').all(channelId) as LiveUpdate[];
    return updates;
  }

  public getAllLiveUpdates(): LiveUpdate[] {
    const updates = this.db.prepare('SELECT message_id AS messageId, channel_id AS channelId, guild_id AS guildId FROM live_updates').all() as LiveUpdate[];
    return updates;
  }

  public close(): void {
    this.db.close();
  }
}