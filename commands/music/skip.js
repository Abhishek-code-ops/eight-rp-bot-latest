'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const music  = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the currently playing song.'),

  cooldown: 2,

  async execute(client, interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You must be in a voice channel.')],
        ephemeral: true,
      });
    }

    const queue = music.getQueue(client, interaction.guild.id);

    if (!queue || !queue.playing) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ Nothing is currently playing.')],
        ephemeral: true,
      });
    }

    const current = queue.songs[0];
    const skipped = music.skip(client, interaction.guild.id);

    if (!skipped) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ Could not skip the current song.')],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle('⏭️ Skipped')
          .setDescription(current ? `Skipped: **${current.title}**` : 'Song skipped.')
          .setTimestamp(),
      ],
    });
  },
};
