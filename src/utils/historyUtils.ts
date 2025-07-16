import { PredatorBorderRecord } from '../types/predatorBorderHistory';

const THIRTY_MINUTES_IN_MS = 30 * 60 * 1000;

export function filterHistoryByInterval(history: PredatorBorderRecord[], intervalInMs: number = THIRTY_MINUTES_IN_MS): PredatorBorderRecord[] {
  if (history.length < 2) {
    return history;
  }

  const filteredHistory: PredatorBorderRecord[] = [history[0]];
  let lastTimestamp = history[0].timestamp;

  for (let i = 1; i < history.length; i++) {
    const currentRecord = history[i];
    if (currentRecord.timestamp - lastTimestamp >= intervalInMs) {
      filteredHistory.push(currentRecord);
      lastTimestamp = currentRecord.timestamp;
    }
  }

  // 常に最新のレコードが含まれるようにする
  const lastRecordInOriginalHistory = history[history.length - 1];
  if (filteredHistory[filteredHistory.length - 1].timestamp !== lastRecordInOriginalHistory.timestamp) {
    filteredHistory.push(lastRecordInOriginalHistory);
  }

  return filteredHistory;
}
