import { EmbedBuilder } from 'discord.js';
import { PredatorBorderRecord } from '../types/predatorBorderHistory';

function getDifferenceString(current: number | undefined, previous: number | undefined): string {
  if (current === undefined) {
    return 'No data';
  }
  if (previous === undefined) {
    return '(No data from 24 hours ago)';
  }
  const diff = current - previous;
  const sign = diff >= 0 ? '+' : '';
  return `(${sign}${diff}RP)`;
}

export function createPredatorEmbed(latestRecord: PredatorBorderRecord | null, oldRecord: PredatorBorderRecord | null): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('Apex Legends Predator Border')
    .setColor(0xff0000)
    .setTimestamp()
    .setImage('attachment://predator-border-graph.png');

  if (latestRecord) {
    embed.addFields(
      {
        name: 'PC <:Origin:1393573470545121280>',
        value: `**${latestRecord.pc ?? 'N/A'}** RP ${getDifferenceString(latestRecord.pc, oldRecord?.pc)}`,
        inline: true,
      },
      {
        name: 'PlayStation <:PlayStation:1393573335526281236>',
        value: `**${latestRecord.ps4 ?? 'N/A'}** RP ${getDifferenceString(latestRecord.ps4, oldRecord?.ps4)}`,
        inline: true,
      },
      {
        name: 'Xbox <:Xbox:1393573305143005194>',
        value: `**${latestRecord.x1 ?? 'N/A'}** RP ${getDifferenceString(latestRecord.x1, oldRecord?.x1)}`,
        inline: true,
      }
    );
    if (latestRecord.timestamp) {
      embed.setFooter({ text: `Last updated: ${new Date(latestRecord.timestamp).toLocaleString('en-US')} | The difference is a comparison with the data from 24 hours ago.` });
    }
  } else {
    embed.setDescription('Could not retrieve Predator border data at this time. Please try again later.');
  }

  return embed;
}
