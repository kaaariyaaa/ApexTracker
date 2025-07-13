import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { stopLiveUpdate } from './livePredator'; // livePredator.tsから関数をインポート

export const data = new SlashCommandBuilder()
  .setName('stop-live-predator')
  .setDescription('プレデターボーダーの自動更新を停止します。');

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
    return;
  }

  const stopped = stopLiveUpdate(interaction.guildId);

  if (stopped) {
    await interaction.reply({ content: 'プレデターボーダーの自動更新を停止しました。', ephemeral: true });
  } else {
    await interaction.reply({ content: 'このサーバーで実行中の自動更新はありません。', ephemeral: true });
  }
}
