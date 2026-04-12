'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');
const music  = require('../../systems/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop music, clear the queue and disconnect the bot.'),

  cooldown: 3,

  async execute(client, interaction) {
    if (!interaction.member.voice.channel) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You must be in a voice channel.')],
        ephemeral: true,
      });
    }

    const queue = music.getQueue(client, interaction.guild.id);

    if (!queue) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ Nothing is currently playing.')],
        ephemeral: true,
      });
    }

    music.stop(client, interaction.guild.id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle('⏹️ Music Stopped')
          .setDescription('The queue has been cleared and the bot has disconnected from the voice channel.')
          .setFooter({ text: `Stopped by ${interaction.user.tag}` })
          .setTimestamp(),
      ],
    });
  },
};
