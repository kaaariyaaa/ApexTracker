import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { getPredatorData } from './services/apexApiService';
import { PredatorData } from './types/apexApi';
import { updatePredatorData } from './services/predatorCache';

dotenv.config();

const historyFilePath = path.join(__dirname, '../predator-history.json');

interface HistoryEntry {
  timestamp: string;
  data: PredatorData;
}

async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await fs.readFile(historyFilePath, 'utf-8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Error reading predator history file:', error);
    return [];
  }
}

async function logPredatorBorder(): Promise<void> {
  try {
    const dataToLog = await getPredatorData();
    updatePredatorData(dataToLog); // <--- データをキャッシュに保存

    let history = await readHistory();

    const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000;
    history = history.filter(entry => new Date(entry.timestamp).getTime() >= fortyEightHoursAgo);

    history.push({
      timestamp: new Date().toISOString(),
      data: dataToLog,
    });

    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));
    console.log('Predator border logged successfully and history cleaned.');

  } catch (error) {
    console.error('Failed to log predator border:', error);
  }
}

export function startHistoryLogger(): void {
  logPredatorBorder();
  setInterval(logPredatorBorder, 60 * 1000);
}

