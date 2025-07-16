import Database from 'better-sqlite3';
import * as path from 'path';
import { Client, TextChannel, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PredatorBorderHistoryManager } from './predatorBorderHistoryManager';
import { createPredatorEmbed } from '../utils/embedUtils';
import { createPredatorBorderGraph } from './graphService';

export interface LiveUpdate {
  messageId: string;
  channelId: string;
  guildId: string;
}

export class LiveUpdateManager {
  private db: Database.Database;
  private static instance: LiveUpdateManager;
  private static readonly DB_FILE_PATH = path.join(__dirname, '../../live-updates.db');
  private client: Client | null = null;
  private predatorBorderHistoryManager: PredatorBorderHistoryManager;

  private constructor() {
    this.db = new Database(LiveUpdateManager.DB_FILE_PATH);
    this.initDatabase();
    this.predatorBorderHistoryManager = PredatorBorderHistoryManager.getInstance();
  }

  public static getInstance(): LiveUpdateManager {
    if (!LiveUpdateManager.instance) {
      LiveUpdateManager.instance = new LiveUpdateManager();
    }
    return LiveUpdateManager.instance;
  }

  public setClient(client: Client): void {
    this.client = client;
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

  public getAllLiveUpdates(): LiveUpdate[] {
    const updates = this.db.prepare('SELECT message_id AS messageId, channel_id AS channelId, guild_id AS guildId FROM live_updates').all() as LiveUpdate[];
    return updates;
  }

  public async updateMessages(): Promise<void> {
    if (!this.client) return;

    const updates = this.getAllLiveUpdates();
    const latestRecord = this.predatorBorderHistoryManager.getLatestRecord();
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oldRecord = this.predatorBorderHistoryManager.getRecordAroundTimestamp(twentyFourHoursAgo);
    const history = this.predatorBorderHistoryManager.getHistory();

    const embed = createPredatorEmbed(latestRecord, oldRecord);
    let files: AttachmentBuilder[] = [];

    if (history.length > 1) {
        const graphImage = await createPredatorBorderGraph(history);
        const attachment = new AttachmentBuilder(graphImage, { name: 'predator-border-graph.png' });
        files.push(attachment);
    }

    for (const update of updates) {
      try {
        const channel = await this.client.channels.fetch(update.channelId) as TextChannel;
        if (channel) {
          const message = await channel.messages.fetch(update.messageId);
          if (message) {
            await message.edit({ embeds: [embed], files: files });
          }
        }
      } catch (error: any) { // Changed type to any to access error.code
        console.error(`Failed to update message ${update.messageId}:`, error);
        if (error.code === 10008) { // Unknown Message
          this.removeLiveUpdate(update.messageId);
        }
      }
    }
  }

  public close(): void {
    this.db.close();
  }
}