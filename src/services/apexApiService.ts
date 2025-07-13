import axios from 'axios';
import { PredatorData, PlayerData } from '../types/apexApi';

const API_BASE_URL = 'https://api.mozambiquehe.re';

function getApiKey(): string {
  const apiKey = process.env.APEX_API_KEY;
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。');
  }
  return apiKey;
}

export async function getPredatorData(): Promise<PredatorData> {
  const apiKey = getApiKey();
  const response = await axios.get(`${API_BASE_URL}/predator?auth=${apiKey}`);
  return response.data.RP;
}

export async function getPlayerData(playerName: string, platform: string): Promise<PlayerData> {
  const apiKey = getApiKey();
  const response = await axios.get(`${API_BASE_URL}/bridge?auth=${apiKey}&player=${playerName}&platform=${platform}`);
  return response.data;
}
