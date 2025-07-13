import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getPlayerData, getPredatorData } from '../services/apexApiService';
import { PlayerData, PredatorData } from '../types/apexApi';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('指定したプレイヤーのApex Legends統計情報を表示します。')
  .addStringOption(option =>
    option.setName('player')
      .setDescription('プレイヤー名')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('platform')
      .setDescription('プラットフォーム (PC, PS4, X1)')
      .setRequired(true)
      .addChoices(
        { name: 'PC', value: 'PC' },
        { name: 'PlayStation', value: 'PS4' },
        { name: 'Xbox', value: 'X1' },
      ));

function createStatsEmbed(playerData: PlayerData, predatorData: PredatorData, platform: string): EmbedBuilder {
  const { global, total } = playerData;
  const { rank, level, levelPrestige, name: playerNameFromApi } = global;
  const { rankName, rankDiv, rankScore, rankImg } = rank;
  const totalLevel = level + levelPrestige * 1000;

  const embed = new EmbedBuilder()
    .setTitle(`Stats for ${playerNameFromApi} (${global.platform})`)
    .setColor(0x0099ff)
    .setThumbnail(rankImg)
    .addFields({ name: 'Level', value: `${totalLevel}`, inline: false });

  if (rankName !== 'Master' && rankName !== 'Apex Predator') {
    embed.addFields({ name: 'Rank', value: `${rankName} ${rankDiv} ${rankScore} RP`, inline: false });
  } else {
    embed.addFields({ name: 'Rank', value: `${rankName} ${rankScore} RP`, inline: false });
  }

  if (total.career_kills) {
    embed.addFields({ name: 'Career Kills', value: `${total.career_kills.value}`, inline: true });
  }

  const platformKey = platform as keyof PredatorData;
  const predatorRp = predatorData[platformKey].val;
  const difference = rankScore - predatorRp;
  const differenceString = difference >= 0 ? `+${difference}` : `${difference*-1}`;

  embed.addFields({
    name: 'Predator Border',
    value: `${predatorRp} RP (Diff: ${differenceString})`,
    inline: false,
  });

  embed.setTimestamp().setFooter({ text: 'Apex Legends Stats' });

  return embed;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const playerName = interaction.options.getString('player', true);
  const platform = interaction.options.getString('platform', true);

  try {
    const playerData = await getPlayerData(playerName, platform);

    if (playerData.Error) {
      await interaction.editReply(`エラー: ${playerData.Error}`);
      return;
    }

    const predatorData = await getPredatorData();
    const embed = createStatsEmbed(playerData, predatorData, platform);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'プレイヤー情報の取得に失敗しました。';
    await interaction.editReply(errorMessage);
  }
}

