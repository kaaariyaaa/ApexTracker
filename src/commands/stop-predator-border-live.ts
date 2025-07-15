import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { LiveUpdateManager } from '../services/liveUpdateManager';

const liveUpdateManager = new LiveUpdateManager();

export const data = new SlashCommandBuilder()
  .setName('stop-predator-border-live')
  .setDescription('Stops the live update of the Predator border in the current channel.');

export async function execute(interaction: CommandInteraction) {
  if (!interaction.channelId) {
    await interaction.reply({ content: 'This command can only be used in a channel.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const liveUpdates = liveUpdateManager.getLiveUpdatesByGuild(interaction.guildId!);
  const updatesInChannel = liveUpdates.filter(update => update.channelId === interaction.channelId);

  if (updatesInChannel.length === 0) {
    await interaction.editReply({ content: 'No live Predator border updates are running in this channel.' });
    return;
  }

  for (const update of updatesInChannel) {
    liveUpdateManager.removeLiveUpdate(update.messageId);
  }

  await interaction.editReply({ content: 'Live Predator border updates have been stopped in this channel.' });
}
