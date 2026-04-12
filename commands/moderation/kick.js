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
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to kick').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the kick').setRequired(false)
    ),

  async execute(client, interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ User not found.')],
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You cannot kick yourself.')],
        ephemeral: true,
      });
    }

    if (!target.kickable) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ I cannot kick this user.')],
        ephemeral: true,
      });
    }

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`👢 You have been kicked from ${interaction.guild.name}`)
      .addFields(
        { name: 'Reason',    value: reason,               inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
    await target.kick(`${interaction.user.tag}: ${reason}`);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('👢 Member Kicked')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User',      value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`,           inline: true },
        { name: 'Reason',    value: reason,                              inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const guildConfig = db.getGuildConfig(interaction.guild.id);
    const logChannelId = guildConfig.modLogChannelId || guildConfig.logChannelId;
    if (logChannelId) {
      const logCh = interaction.guild.channels.cache.get(logChannelId);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
