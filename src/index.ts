import { Client, Collection, Events, GatewayIntentBits, Interaction, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { loadCommands, Command } from './utils/commandLoader';
import { PredatorBorderHistoryManager } from './services/predatorBorderHistoryManager';
import { LiveUpdateManager } from './services/liveUpdateManager';
import { getPredatorData } from './services/apexApiService';
import { createPredatorEmbed } from './commands/predator-live';

dotenv.config();

const predatorBorderHistoryManager = PredatorBorderHistoryManager.getInstance();
const liveUpdateManager = LiveUpdateManager.getInstance();

async function startPredatorBorderLogger() {
  try {
    const predatorData = await getPredatorData();
    predatorBorderHistoryManager.addRecord(predatorData.PC.val, predatorData.PS4.val, predatorData.X1.val);
  } catch (error) {
    console.error('Failed to fetch and record predator border data:', error);
  }
  // Run every minute
  setTimeout(startPredatorBorderLogger, 60000);
}

async function startLiveUpdateLoop(client: Client) {
  try {
    const allLiveUpdates = liveUpdateManager.getAllLiveUpdates();
    if (allLiveUpdates.length === 0) {
      // No active live updates to process.
    } else {
      const latestRecord = predatorBorderHistoryManager.getLatestRecord();
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      const oldRecord = predatorBorderHistoryManager.getRecordAroundTimestamp(twentyFourHoursAgo);
      const embed = createPredatorEmbed(latestRecord, oldRecord);

      for (const update of allLiveUpdates) {
        if (!update.channelId || !update.messageId) {
          liveUpdateManager.removeLiveUpdate(update.messageId);
          continue;
        }
        try {
          const channel = await client.channels.fetch(update.channelId);
          if (channel && channel.isTextBased()) {
            const message = await (channel as TextChannel).messages.fetch(update.messageId);
            await message.edit({ embeds: [embed] });
          } else {
            liveUpdateManager.removeLiveUpdate(update.messageId);
          }
        } catch (error) {
          console.error(`Failed to update message ${update.messageId} in channel ${update.channelId}:`, error);
          // If message or channel is not found, remove it from live updates
          if (error instanceof Error && (error.message.includes('Unknown Message') || error.message.includes('Unknown Channel'))) {
            liveUpdateManager.removeLiveUpdate(update.messageId);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in live update loop:', error);
  }
  // Run every minute
  setTimeout(() => startLiveUpdateLoop(client), 60000);
}

class CustomClient extends Client {
  public commands: Collection<string, Command>;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
    this.commands = new Collection();
  }
}

const client = new CustomClient();
client.commands = loadCommands();

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  startPredatorBorderLogger();
  startLiveUpdateLoop(client);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const replyOptions = { content: 'An error occurred while executing this command.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  throw new Error('DISCORD_TOKEN must be set in .env file');
}

client.login(token);

process.on('SIGINT', () => {
  predatorBorderHistoryManager.close();
  liveUpdateManager.close();
  process.exit();
});

process.on('SIGTERM', () => {
  predatorBorderHistoryManager.close();
  liveUpdateManager.close();
  process.exit();
});
