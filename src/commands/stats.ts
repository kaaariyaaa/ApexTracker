import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';

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

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const playerId = interaction.options.getString('player');
  const platform = interaction.options.getString('platform');

  try {
    const apiKey = process.env.APEX_API_KEY;
    if (!apiKey) {
      await interaction.editReply('APIキーが設定されていません。');
      return;
    }

    const response = await axios.get(
      `https://api.mozambiquehe.re/bridge?auth=${apiKey}&player=${playerId}&platform=${platform}`
    );

    const playerData = response.data;
    //console.log(JSON.stringify(playerData));

    if (playerData.Error) {
      await interaction.editReply(`エラー: ${playerData.Error}`);
      return;
    }
    
    const global = playerData.global;
    const rankName = global.rank.rankName;
    const rankDiv = global.rank.rankDiv;;
    const rp = global.rank.rankScore;
    const level = global.level + playerData.global.levelPrestige * 1000;
    const rankIcon = global.rank.rankImg;
    const playerName = playerData.global.name;
    const total = playerData.total;
    const career_kills = total.career_kills
    const kills = career_kills.value;
    const selectedLegendIcon = playerData.legends.selected.ImgAssets.icon;

    const embed = new EmbedBuilder()
      .setTitle(`Statistics on ${playerId} (${playerData.global.platform})`)
      .setColor(0x0099ff)
      .setThumbnail(rankIcon)
      .addFields(
        { name: 'Name', value: `${playerName}`, inline: false },
      )
      if(rankName != "Master" && rankName != "Predator"){
        embed.addFields(
          { name: 'Level', value: `${level}`, inline: false },
          { name: 'Rank', value: `${rankName} ${rankDiv} ${rp}pt`, inline: false },
        ) 
      }
      else{
        embed.addFields(
          { name: 'Level', value: `${level}`, inline: false },
          { name: 'Rank', value: `${rankName} ${rp}rp`, inline: false },
        ) 
      }
      embed.setTimestamp()
      .setFooter({ text: 'Apex Legends Stats' });

    // バトルロイヤル統計情報
    if (career_kills && total) {
      embed.addFields(
        { name: 'Carrer Kills', value: `${kills}`, inline: true },
      );
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error: any) {
    console.error(error);
    if (error.response && error.response.data && error.response.data.Error) {
      await interaction.editReply(`エラー: ${error.response.data.Error}`);
    } else {
      await interaction.editReply('プレイヤー情報の取得に失敗しました。');
    }
  }
}
