'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const music  = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue.')
    .addIntegerOption(opt =>
      opt.setName('page')
        .setDescription('Page number (default: 1)')
        .setMinValue(1)
        .setRequired(false)
    ),

  cooldown: 5,

  async execute(client, interaction) {
    const queue = music.getQueue(client, interaction.guild.id);

    if (!queue || queue.songs.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setDescription('🎵 The queue is currently empty. Use `/play` to add songs!'),
        ],
        ephemeral: true,
      });
    }

    const page       = interaction.options.getInteger('page') ?? 1;
    const pageSize   = 10;
    const totalPages = Math.ceil(queue.songs.length / pageSize);
    const safePage   = Math.min(page, totalPages);
    const start      = (safePage - 1) * pageSize;
    const pageSongs  = queue.songs.slice(start, start + pageSize);

    const current = queue.songs[0];

    const songList = pageSongs.map((song, i) => {
      const index   = start + i;
      const prefix  = index === 0 ? '🎵 **Now Playing**' : `\`${index}.\``;
      return `${prefix} [${song.title}](${song.url}) — \`${song.duration}\``;
    }).join('\n');

    const totalDurationSec = queue.songs.reduce(
      (acc, s) => acc + (s.durationMs ? s.durationMs / 1000 : 0), 0
    );
    const totalMin = Math.floor(totalDurationSec / 60);
    const totalSec = Math.floor(totalDurationSec % 60);

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎶 Music Queue')
      .setThumbnail(current.thumbnail)
      .setDescription(songList)
      .addFields(
        { name: '📋 Total Songs',    value: `**${queue.songs.length}**`,             inline: true },
        { name: '⏱️ Total Duration', value: `**${totalMin}m ${totalSec}s**`,          inline: true },
        { name: '🔊 Voice Channel',  value: `**${queue.voiceChannel.name}**`,         inline: true },
      )
      .setFooter({ text: `Page ${safePage}/${totalPages} • Use /play to add more songs` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
