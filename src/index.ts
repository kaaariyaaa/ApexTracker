import { Client, Collection, Events, GatewayIntentBits, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { loadCommands, Command } from './utils/commandLoader';
import { PredatorBorderHistoryManager } from './services/predatorBorderHistoryManager';
import { getPredatorData } from './services/apexApiService';

dotenv.config();

const predatorBorderHistoryManager = new PredatorBorderHistoryManager();

async function startPredatorBorderLogger() {
  try {
    const predatorData = await getPredatorData();
    predatorBorderHistoryManager.addRecord(predatorData.PC.val, predatorData.PS4.val, predatorData.X1.val);
    console.log(`Predator border recorded: PC=${predatorData.PC.val}, PS4=${predatorData.PS4.val}, Xbox=${predatorData.X1.val}`);
  } catch (error) {
    console.error('Failed to fetch and record predator border data:', error);
  }
  // 1分ごとに実行
  setTimeout(startPredatorBorderLogger, 60000);
}



class CustomClient extends Client {
  public commands: Collection<string, Command>;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.commands = new Collection();
  }
}

const client = new CustomClient();
client.commands = loadCommands();

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  startPredatorBorderLogger();
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
    const replyOptions = { content: 'コマンド実行中にエラーが発生しました。', ephemeral: true };
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
  process.exit();
});

process.on('SIGTERM', () => {
  predatorBorderHistoryManager.close();
  process.exit();
});
