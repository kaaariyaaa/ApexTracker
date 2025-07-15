import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPredatorData } from '../services/apexApiService';
import { PredatorBorderHistoryManager } from '../services/predatorBorderHistoryManager';
import { PredatorData } from '../types/apexApi';
import { PredatorBorderRecord } from '../types/predatorBorderHistory';

const predatorBorderHistoryManager = new PredatorBorderHistoryManager();

export const data = new SlashCommandBuilder()
  .setName('predator')
  .setDescription('Displays the current Apex Legends Predator border and the difference from 24 hours ago.');

function getDifferenceString(current: number, previous: number | undefined): string {
  if (previous === undefined) {
    return '(No data from 24 hours ago)';
  }
  const diff = current - previous;
  const sign = diff >= 0 ? '+' : '';
  return `(${sign}${diff})`;
}

function createPredatorEmbed(newData: PredatorData, oldRecord: PredatorBorderRecord | null): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Apex Legends Predator Borders')
    .setColor(0xff0000)
    .setTimestamp()
    .addFields(
      {
        name: 'PC <:Origin:1393573470545121280>',
        value: `RP: ${newData.PC.val} ${getDifferenceString(newData.PC.val, oldRecord?.pc)}`,
        inline: false,
      },
      {
        name: 'PlayStation <:PlayStation:1393573335526281236>',
        value: `RP: ${newData.PS4.val} ${getDifferenceString(newData.PS4.val, oldRecord?.ps4)}`,
        inline: false,
      },
      {
        name: 'Xbox <:Xbox:1393573305143005194>',
        value: `RP: ${newData.X1.val} ${getDifferenceString(newData.X1.val, oldRecord?.x1)}`,
        inline: false,
      }
    )
    .setFooter({ text: 'The difference is a comparison with the data from 24 hours ago.' });
}

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  try {
    const newData = await getPredatorData();
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oldRecord = predatorBorderHistoryManager.getRecordAroundTimestamp(twentyFourHoursAgo);
    const embed = createPredatorEmbed(newData, oldRecord);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve Predator border.';
    await interaction.editReply(errorMessage);
  }
}

