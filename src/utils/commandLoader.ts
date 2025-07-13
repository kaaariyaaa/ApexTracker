import fs from 'node:fs';
import path from 'node:path';
import { Collection } from 'discord.js';

export interface Command {
  data: any;
  execute: (...args: any[]) => any;
}

export function loadCommands(): Collection<string, Command> {
  const commands = new Collection<string, Command>();
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const command = require(filePath) as Command;
      if ('data' in command && 'execute' in command) {
        commands.set(command.data.name, command);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load the command at ${filePath}:`, error);
    }
  }
  return commands;
}
