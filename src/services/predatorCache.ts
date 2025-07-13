import { PredatorData } from '../types/apexApi';

let latestPredatorData: PredatorData | null = null;

export function getLatestPredatorData(): PredatorData | null {
  return latestPredatorData;
}

export function updatePredatorData(data: PredatorData): void {
  latestPredatorData = data;
}
