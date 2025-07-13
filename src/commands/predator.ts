import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const historyFilePath = path.join(__dirname, '..\/..\/predator-history.json');

// 型定義 (historyLogger.ts と同じものを定義)
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

export const data = new SlashCommandBuilder()
  .setName('predator')
  .setDescription('現在のApex Legendsのプレデターボーダーと24時間前の差分を表示します。');

async function get24HourOldData(): Promise<PredatorData | null> {
  try {
    const fileContent = await fs.readFile(historyFilePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    const history: HistoryEntry[] = Array.isArray(parsedContent) ? parsedContent : [];

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 24時間前のデータに最も近いエントリを探す
    let closestEntry: HistoryEntry | null = null;
    let minDiffMs = Infinity;

    for (const entry of history) {
      const entryTime = new Date(entry.timestamp);
      const diffMs = Math.abs(twentyFourHoursAgo.getTime() - entryTime.getTime());

      // 許容範囲を設ける (例: ±5分以内)
      const toleranceMs = 5 * 60 * 1000; // 5 minutes
      if (diffMs <= toleranceMs && diffMs < minDiffMs) {
        minDiffMs = diffMs;
        closestEntry = entry;
      }
    }
    return closestEntry ? closestEntry.data : null;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null; // ファイルが存在しない場合はnullを返す
    }
    console.error('Error reading predator history file for 24-hour data:', error);
    return null;
  }
}

function getDifferenceString(current: number, previous: number | undefined): string {
    if (previous === undefined || previous === null) { // null check for previous
        return '(24時間前データなし)';
    }
    const diff = current - previous;
    if (diff > 0) {
        return `(+${diff})`;
    } else if (diff < 0) {
        return `(${diff})`;
    } else {
        return '(±0)';
    }
}

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  try {
    const apiKey = process.env.APEX_API_KEY;
    if (!apiKey) {
      await interaction.editReply('APIキーが設定されていません。');
      return;
    }

    // APIから最新データを取得
    const response = await axios.get(`https://api.mozambiquehe.re/predator?auth=${apiKey}`);
    const newData: PredatorData = {
        PC: response.data.RP.PC,
        PS4: response.data.RP.PS4,
        X1: response.data.RP.X1,
    };

    // 24時間前の履歴データを取得
    const oldData24HoursAgo = await get24HourOldData();

    // 差分を計算
    const pcDiff = getDifferenceString(newData.PC.val, oldData24HoursAgo?.PC.val);
    const ps4Diff = getDifferenceString(newData.PS4.val, oldData24HoursAgo?.PS4.val);
    const x1Diff = getDifferenceString(newData.X1.val, oldData24HoursAgo?.X1.val);

    const embed = new EmbedBuilder()
      .setTitle('Apex Legends Predator Borders')
      .setColor(0xff0000)
      .setTimestamp()
      .addFields(
        {
          name: 'PC <:Origin:1393573470545121280>',
          value: `RP: ${newData.PC.val} ${pcDiff}`,
          inline: false,
        },
        {
          name: 'PlayStation <:PlayStation:1393573335526281236>',
          value: `RP: ${newData.PS4.val} ${ps4Diff}`,
          inline: false,
        },
        {
          name: 'Xbox <:Xbox:1393573305143005194>',
          value: `RP: ${newData.X1.val} ${x1Diff}`,
          inline: false,
        }
      )
      .setFooter({ text: '差分は24時間前のデータとの比較です。' });

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    await interaction.editReply('プレデターボーダーの取得に失敗しました。');
  }
}