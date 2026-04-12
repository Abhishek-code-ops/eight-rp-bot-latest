'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addChannelOption(option =>
      option.setName('logs')
        .setDescription('Select log channel')
        .setRequired(true)
    )

    .addRoleOption(option =>
      option.setName('citizen')
        .setDescription('Select citizen role')
        .setRequired(true)
    ),

  async execute(client, interaction) {
    const logChannel = interaction.options.getChannel('logs');
    const citizenRole = interaction.options.getRole('citizen');

    // SAVE TO CLIENT MEMORY (temporary config)
    client.config = {
      logChannelId: logChannel.id,
      citizenRoleId: citizenRole.id,
    };

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Setup Complete')
      .addFields(
        { name: 'Logs Channel', value: `<#${logChannel.id}>`, inline: true },
        { name: 'Citizen Role', value: `<@&${citizenRole.id}>`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });
  },
};