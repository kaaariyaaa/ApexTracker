import { PredatorBorderRecord } from '../types/predatorBorderHistory';
import Database from 'better-sqlite3';
import * as path from 'path';

export class PredatorBorderHistoryManager {
  private db: Database.Database;
  private static readonly DB_FILE_PATH = path.join(__dirname, '../../predator-border-history.db');

  constructor() {
    this.db = new Database(PredatorBorderHistoryManager.DB_FILE_PATH);
    this.initDatabase();
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS predator_border_history (
        timestamp INTEGER PRIMARY KEY,
        pc INTEGER,
        ps4 INTEGER,
        x1 INTEGER
      )
    `);
  }

  /**
   * Adds a new predator border record.
   * @param pc The RP value for the PC predator border.
   * @param ps4 The RP value for the PS4 predator border.
   * @param x1 The RP value for the Xbox predator border.
   */
  public addRecord(pc: number, ps4: number, x1: number): void {
    const stmt = this.db.prepare('INSERT INTO predator_border_history (timestamp, pc, ps4, x1) VALUES (?, ?, ?, ?)');
    stmt.run(Date.now(), pc, ps4, x1);
  }

  /**
   * Retrieves the entire history of predator border records.
   * @returns An array of predator border records.
   */
  public getHistory(): PredatorBorderRecord[] {
    const rows = this.db.prepare('SELECT * FROM predator_border_history ORDER BY timestamp ASC').all();
    return rows as PredatorBorderRecord[];
  }

  /**
   * Retrieves the latest predator border record.
   * @returns The latest record, or null if not found.
   */
  public getLatestRecord(): PredatorBorderRecord | null {
    const row = this.db.prepare('SELECT * FROM predator_border_history ORDER BY timestamp DESC LIMIT 1').get();
    return (row as PredatorBorderRecord) || null;
  }

  /**
   * Retrieves the predator border record closest to the specified timestamp.
   * @param timestamp The timestamp to search for (in milliseconds).
   * @returns The record closest to the specified timestamp, or null if not found.
   */
  public getRecordAroundTimestamp(timestamp: number): PredatorBorderRecord | null {
    // Get the latest record before or at the specified timestamp
    const beforeRecord = this.db.prepare('SELECT * FROM predator_border_history WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1').get(timestamp) as PredatorBorderRecord | undefined;
    // Get the earliest record after or at the specified timestamp
    const afterRecord = this.db.prepare('SELECT * FROM predator_border_history WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1').get(timestamp) as PredatorBorderRecord | undefined;

    if (!beforeRecord && !afterRecord) {
      return null;
    }

    if (beforeRecord && afterRecord) {
      const diffBefore = timestamp - beforeRecord.timestamp!;
      const diffAfter = afterRecord.timestamp! - timestamp;
      return diffBefore <= diffAfter ? beforeRecord : afterRecord;
    } else if (beforeRecord) {
      return beforeRecord;
    } else {
      return afterRecord || null;
    }
  }

  /**
   * Closes the database connection.
   */
  public close(): void {
    this.db.close();
  }
