'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config             = require('../../config/config');
const { getLeaderboard } = require('../../systems/leveling');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server XP leaderboard.')
    .addIntegerOption(opt =>
      opt.setName('limit')
        .setDescription('Number of users to show (default: 10, max: 25)')
        .setMinValue(3).setMaxValue(25)
        .setRequired(false)
    ),

  cooldown: 15,

  async execute(client, interaction) {
    const limit      = interaction.options.getInteger('limit') ?? 10;
    const lb         = getLeaderboard(interaction.guild.id, limit);

    if (lb.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setDescription('📊 No data yet! Start chatting to earn XP.'),
        ],
        ephemeral: true,
      });
    }

    const entries = await Promise.all(
      lb.map(async (entry, i) => {
        let tag = `Unknown User`;
        try {
          const user = await client.users.fetch(entry.userId);
          tag        = user.username;
        } catch {}

        const medal  = MEDALS[i] ?? `\`${i + 1}.\``;
        return `${medal} **${tag}** — Level ${entry.level} (${entry.xp.toLocaleString()} XP)`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle(`🏆 ${interaction.guild.name} — XP Leaderboard`)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription(entries.join('\n'))
      .setFooter({ text: `Top ${lb.length} members • Use /rank to check your own rank` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
