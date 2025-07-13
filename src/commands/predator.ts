import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { getPredatorData } from '../services/apexApiService';
import { PredatorData } from '../types/apexApi';

const historyFilePath = path.join(__dirname, '../../predator-history.json');

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
    const history: HistoryEntry[] = JSON.parse(fileContent);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let closestEntry: HistoryEntry | null = null;
    let minDiffMs = Infinity;

    for (const entry of history) {
      const entryTime = new Date(entry.timestamp);
      const diffMs = Math.abs(twentyFourHoursAgo.getTime() - entryTime.getTime());

      if (diffMs < minDiffMs) {
        minDiffMs = diffMs;
        closestEntry = entry;
      }
    }
    return closestEntry ? closestEntry.data : null;

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    console.error('Error reading predator history file for 24-hour data:', error);
    return null;
  }
}

function getDifferenceString(current: number, previous: number | undefined): string {
  if (previous === undefined) {
    return '(24時間前データなし)';
  }
  const diff = current - previous;
  return diff >= 0 ? `(+${diff})` : `(-${diff})`;
}

function createPredatorEmbed(newData: PredatorData, oldData: PredatorData | null): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Apex Legends Predator Borders')
    .setColor(0xff0000)
    .setTimestamp()
    .addFields(
      {
        name: 'PC <:Origin:1393573470545121280>',
        value: `RP: ${newData.PC.val} ${getDifferenceString(newData.PC.val, oldData?.PC.val)}`,
        inline: false,
      },
      {
        name: 'PlayStation <:PlayStation:1393573335526281236>',
        value: `RP: ${newData.PS4.val} ${getDifferenceString(newData.PS4.val, oldData?.PS4.val)}`,
        inline: false,
      },
      {
        name: 'Xbox <:Xbox:1393573305143005194>',
        value: `RP: ${newData.X1.val} ${getDifferenceString(newData.X1.val, oldData?.X1.val)}`,
        inline: false,
      }
    )
    .setFooter({ text: '差分は24時間前のデータとの比較です。' });
}

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  try {
    const newData = await getPredatorData();
    const oldData = await get24HourOldData();
    const embed = createPredatorEmbed(newData, oldData);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'プレデターボーダーの取得に失敗しました。';
    await interaction.editReply(errorMessage);
  }
}

