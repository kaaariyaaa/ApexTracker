import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const historyFilePath = path.join(__dirname, '..\/predator-history.json');

interface PlatformData {
  val: number;
  totalMastersAndPreds: number;
}

interface PredatorData {
  PC: PlatformData;
  PS4: PlatformData;
  X1: PlatformData;
}

interface HistoryEntry {
  timestamp: string;
  data: PredatorData;
}

async function readHistory(): Promise<HistoryEntry[]> {
  try {
    const data = await fs.readFile(historyFilePath, 'utf-8');
    if (data.trim() === '') {
      return []; // ファイルが空の場合は空の配列を返す
    }
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return []; // ファイルが存在しない場合は空の配列を返す
    }
    console.error('Error reading predator history file:', error);
    return [];
  }
}




async function logPredatorBorder(): Promise<void> {
  try {
    const apiKey = process.env.APEX_API_KEY;
    if (!apiKey) {
      console.error('APEX_API_KEY is not set in .env file. Cannot log predator border.');
      return;
    }

    const response = await axios.get(
      `https://api.mozambiquehe.re/predator?auth=${apiKey}`
    );

    const currentData = response.data.RP;

    // Switchデータを除外
    const dataToLog: PredatorData = {
      PC: currentData.PC,
      PS4: currentData.PS4,
      X1: currentData.X1,
    };

    // 既存の履歴を読み込む
    let history = await readHistory();

    // 24時間以上経過したエントリをフィルタリング
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    history = history.filter(entry => new Date(entry.timestamp).getTime() >= fortyEightHoursAgo.getTime());

    // 新しいエントリを追加
    history.push({
      timestamp: now.toISOString(),
      data: dataToLog,
    });

    // 更新された履歴をファイルに上書き保存
    const dir = path.dirname(historyFilePath);
    await fs.mkdir(dir, { recursive: true }); // ディレクトリが存在しない場合は作成
    await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2));

    console.log('Predator border logged successfully and history cleaned.');
  } catch (error) {
    console.error('Failed to log predator border:', error);
  }
}

export function startHistoryLogger(): void {
  // Bot起動時に一度実行
  logPredatorBorder();
  // 1分ごとに実行
  setInterval(logPredatorBorder, 60 * 1000); // 60 seconds * 1000 ms = 1 minute
}
