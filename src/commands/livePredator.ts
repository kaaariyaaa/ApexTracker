import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { getLatestPredatorData } from '../services/predatorCache';

// サーバーごとに更新タスクを管理
const activeUpdates = new Map<string, NodeJS.Timeout>();

export const data = new SlashCommandBuilder()
  .setName('live-predator')
  .setDescription('プレデターボーダーの情報を1分ごとに自動更新します。');

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'このコマンドはサーバー内でのみ使用できます。', ephemeral: true });
    return;
  }

  if (activeUpdates.has(interaction.guildId)) {
    await interaction.reply({ content: 'このサーバーでは既に自動更新が実行中です。', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  const initialData = getLatestPredatorData();
  if (!initialData) {
    await interaction.editReply('まだプレデターデータを取得できていません。少し待ってから再度お試しください。');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('Live Predator Border')
    .setDescription('この埋め込みは1分ごとに自動更新されます。')
    .setColor(0xff0000)
    .setTimestamp();

  Object.entries(initialData).forEach(([platform, data]) => {
    embed.addFields({ name: platform, value: `RP: ${data.val}`, inline: false });
  });

  const message = await interaction.editReply({ embeds: [embed] });

  const intervalId = setInterval(async () => {
    const currentData = getLatestPredatorData();
    if (!currentData) return;

    const newEmbed = new EmbedBuilder()
      .setTitle('Live Predator Border')
      .setDescription('この埋め込みは1分ごとに自動更新されます。')
      .setColor(0xff0000)
      .setTimestamp();

    Object.entries(currentData).forEach(([platform, data]) => {
      newEmbed.addFields({ name: platform, value: `RP: ${data.val}`, inline: false });
    });

    try {
      await message.edit({ embeds: [newEmbed] });
    } catch (error) {
      console.error('Failed to edit message for live predator update:', error);
      // メッセージが削除されたなどで編集に失敗したら、更新を停止する
      clearInterval(intervalId);
      activeUpdates.delete(interaction.guildId!);
    }
  }, 60 * 1000);

  activeUpdates.set(interaction.guildId, intervalId);
}

// 他のファイルから更新を停止するためにエクスポート
export function stopLiveUpdate(guildId: string) {
  if (activeUpdates.has(guildId)) {
    clearInterval(activeUpdates.get(guildId)!);
    activeUpdates.delete(guildId);
    return true; // 停止成功
  }
  return false; // 停止対象なし
}
