'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { buildRankEmbed }      = require('../../systems/leveling');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your rank or another user\'s rank.')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),

  cooldown: 5,

  async execute(client, interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const embed  = buildRankEmbed(target, interaction.guild.id);

    await interaction.reply({ embeds: [embed] });
  },
};
