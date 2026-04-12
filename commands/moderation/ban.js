'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const config = require('../../config/config');
const db     = require('../../systems/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to ban').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the ban').setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0).setMaxValue(7).setRequired(false)
    ),

  async execute(client, interaction) {
    const target     = interaction.options.getMember('user');
    const reason     = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    if (!target) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ User not found in this server.')],
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You cannot ban yourself.')],
        ephemeral: true,
      });
    }

    if (!target.bannable) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ I cannot ban this user. They may have higher permissions.')],
        ephemeral: true,
      });
    }

    // DM the user before banning
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`🔨 You have been banned from ${interaction.guild.name}`)
      .addFields(
        { name: 'Reason',      value: reason,                   inline: true },
        { name: 'Moderator',   value: interaction.user.tag,     inline: true },
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    // Execute ban
    await target.ban({ reason: `${interaction.user.tag}: ${reason}`, deleteMessageDays: deleteDays });

    // Reply
    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🔨 Member Banned')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User',      value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`,           inline: true },
        { name: 'Reason',    value: reason,                              inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log
    const guildConfig = db.getGuildConfig(interaction.guild.id);
    const logChannelId = guildConfig.modLogChannelId || guildConfig.logChannelId;
    if (logChannelId) {
      const logCh = interaction.guild.channels.cache.get(logChannelId);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
