import { Client, Collection, Events, GatewayIntentBits, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { startHistoryLogger } from './historyLogger';

dotenv.config();

// discord.js Clientを拡張して、commandsプロパティを持たせる
class CustomClient extends Client {
  public commands: Collection<string, any>;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.commands = new Collection();
  }
}

const client = new CustomClient();

// commandsフォルダからコマンドファイルを動的に読み込む
const commandsPath = path.join(__dirname, 'commands');
// TypeScriptでコンパイルすると.jsファイルになるため、.jsでフィルタリング
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // 読み込んだコマンドをCollectionに登録
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Clientが準備できたときのイベント
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    startHistoryLogger(); // Bot起動時に履歴ロガーを開始
});

// Interactionが作成されたときのイベント
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
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        } else {
            await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
        }
    }
});

// BotをDiscordにログインさせる
client.login(process.env.DISCORD_TOKEN);
