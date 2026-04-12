'use strict';

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name or URL')
        .setRequired(true)
    ),

  async execute(client, interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply("❌ Join a voice channel first!");
    }

    await interaction.reply(`🔍 Searching: ${query}`);

    client.distube.play(voiceChannel, query, {
      member: interaction.member,
      textChannel: interaction.channel,
    });
  },
};