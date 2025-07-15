import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { LiveUpdateManager } from '../services/liveUpdateManager';

const liveUpdateManager = LiveUpdateManager.getInstance();

export const data = new SlashCommandBuilder()
  .setName('stop-predator-border-live')
  .setDescription('Stops the live update of the Predator border in the current channel.')
  .addStringOption(option =>
    option.setName('message_id')
      .setDescription('The ID of the specific message to stop updating.')
      .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.channelId) {
    await interaction.reply({ content: 'This command can only be used in a channel.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const messageIdToStop = interaction.options.getString('message_id');

  if (messageIdToStop) {
    // Stop a specific message
    const liveUpdate = liveUpdateManager.getLiveUpdate(messageIdToStop);
    if (liveUpdate && liveUpdate.channelId === interaction.channelId) {
      liveUpdateManager.removeLiveUpdate(messageIdToStop);
      await interaction.editReply({ content: `Live update for message ID ${messageIdToStop} has been stopped.` });
    } else {
      await interaction.editReply({ content: `No live update found for message ID ${messageIdToStop} in this channel.` });
    }
  } else {
    // Stop all messages in the current channel
    const liveUpdates = liveUpdateManager.getLiveUpdatesByChannel(interaction.channelId);

    if (liveUpdates.length === 0) {
      await interaction.editReply({ content: 'No live Predator border updates are running in this channel.' });
      return;
    }

    for (const update of liveUpdates) {
      liveUpdateManager.removeLiveUpdate(update.messageId);
    }

    await interaction.editReply({ content: 'All live Predator border updates in this channel have been stopped.' });
  }
}
