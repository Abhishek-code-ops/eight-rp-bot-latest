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
    .setName('unmute')
    .setDescription('Remove a timeout (unmute) from a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to unmute').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for unmute').setRequired(false)
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

    if (!target.isCommunicationDisabled()) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription('⚠️ This user is not currently muted.')],
        ephemeral: true,
      });
    }

    await target.timeout(null, `${interaction.user.tag}: ${reason}`);

    // DM
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`🔊 You have been unmuted in ${interaction.guild.name}`)
      .addFields(
        { name: 'Reason',    value: reason,               inline: true },
        { name: 'Moderator', value: interaction.user.tag, inline: true },
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle('🔊 Member Unmuted')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User',      value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`,           inline: true },
        { name: 'Reason',    value: reason,                              inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    const guildConfig  = db.getGuildConfig(interaction.guild.id);
    const logChannelId = guildConfig.modLogChannelId || guildConfig.logChannelId;
    if (logChannelId) {
      const logCh = interaction.guild.channels.cache.get(logChannelId);
      if (logCh) await logCh.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
