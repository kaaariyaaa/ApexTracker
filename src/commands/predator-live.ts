import { CommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { PredatorBorderHistoryManager } from '../services/predatorBorderHistoryManager';
import { LiveUpdateManager } from '../services/liveUpdateManager';
import { createPredatorBorderGraph } from '../services/graphService';
import { createPredatorEmbed } from '../utils/embedUtils';

const predatorBorderHistoryManager = PredatorBorderHistoryManager.getInstance();
const liveUpdateManager = LiveUpdateManager.getInstance();

export const data = new SlashCommandBuilder()
  .setName('predator-live')
  .setDescription('Displays the current Apex Legends Predator border. (Updates every minute)');

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
    const history = predatorBorderHistoryManager.getHistory();
    const embed = createPredatorEmbed(latestRecord, oldRecord);

    if (history.length > 1) {
        const graphImage = await createPredatorBorderGraph(history);
        const attachment = new AttachmentBuilder(graphImage, { name: 'predator-border-graph.png' });
        const message = await interaction.editReply({ embeds: [embed], files: [attachment] });
        liveUpdateManager.addLiveUpdate(message.id, interaction.channelId, interaction.guildId);
    } else {
        const message = await interaction.editReply({ embeds: [embed] });
        liveUpdateManager.addLiveUpdate(message.id, interaction.channelId, interaction.guildId);
    }

    await interaction.followUp({ content: 'Live update started! The message will be updated every minute.', ephemeral: true });

  } catch (error) {
    console.error('Failed to start live predator border update:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while starting the live update.';
    await interaction.editReply({ content: errorMessage, embeds: [] });
  }
}
