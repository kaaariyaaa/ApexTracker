import { CommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PredatorBorderHistoryManager } from '../services/predatorBorderHistoryManager';
import { LiveUpdateManager } from '../services/liveUpdateManager';
import { PredatorBorderRecord } from '../types/predatorBorderHistory';

const predatorBorderHistoryManager = new PredatorBorderHistoryManager();
const liveUpdateManager = new LiveUpdateManager();

export const data = new SlashCommandBuilder()
  .setName('predator-border-live')
  .setDescription('Displays the current Apex Legends Predator border. (Updates every minute)');

function getDifferenceString(current: number | undefined, previous: number | undefined): string {
  if (current === undefined) {
    return 'No data';
  }
  if (previous === undefined) {
    return '(No data from 24 hours ago)';
  }
  const diff = current - previous;
  const sign = diff >= 0 ? '+' : '';
  return `(${sign}${diff}RP)`;
}

export function createPredatorEmbed(latestRecord: PredatorBorderRecord | null, oldRecord: PredatorBorderRecord | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('Apex Legends Predator Border')
    .setColor(0xff0000)
    .setTimestamp();

  if (latestRecord) {
    embed.addFields(
      {
        name: 'PC <:Origin:1393573470545121280>',
        value: `**${latestRecord.pc ?? 'N/A'}** RP ${getDifferenceString(latestRecord.pc, oldRecord?.pc)}`,
        inline: false,
      },
      {
        name: 'PlayStation <:PlayStation:1393573335526281236>',
        value: `**${latestRecord.ps4 ?? 'N/A'}** RP ${getDifferenceString(latestRecord.ps4, oldRecord?.ps4)}`,
        inline: false,
      },
      {
        name: 'Xbox <:Xbox:1393573305143005194>',
        value: `**${latestRecord.x1 ?? 'N/A'}** RP ${getDifferenceString(latestRecord.x1, oldRecord?.x1)}`,
        inline: false,
      }
    );
    if (latestRecord.timestamp) {
      embed.setFooter({ text: `Last updated: ${new Date(latestRecord.timestamp).toLocaleString('en-US')} | The difference is a comparison with the data from 24 hours ago.` });
    }
  } else {
    embed.setDescription('Could not retrieve Predator border data at this time. Please try again later.');
  }

  return embed;
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.channelId) {
    await interaction.reply({ content: 'This command can only be used in a server channel.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const latestRecord = predatorBorderHistoryManager.getLatestRecord();
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const oldRecord = predatorBorderHistoryManager.getRecordAroundTimestamp(twentyFourHoursAgo);
    const embed = createPredatorEmbed(latestRecord, oldRecord);

    const message = await interaction.editReply({ embeds: [embed] });

    liveUpdateManager.addLiveUpdate(message.id, interaction.channelId, interaction.guildId);
    await interaction.followUp({ content: 'Live update started! The message will be updated every minute.', ephemeral: true });

  } catch (error) {
    console.error('Failed to start live predator border update:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while starting the live update.';
    await interaction.editReply({ content: errorMessage, embeds: [] });
  }
}
