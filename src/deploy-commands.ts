import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { loadCommands } from './utils/commandLoader';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;

if (!token || !clientId) {
  throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in .env file');
}

const commands = loadCommands().map(cmd => cmd.data.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    ) as any[];

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Failed to refresh application commands:', error);
  }
})();
