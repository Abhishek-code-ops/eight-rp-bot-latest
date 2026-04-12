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
    .setName('mute')
    .setDescription('Timeout (mute) a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to mute').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('duration')
        .setDescription('Mute duration in minutes (default: 10)')
        .setMinValue(1).setMaxValue(40320)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the mute').setRequired(false)
    ),

  async execute(client, interaction) {
    const target   = interaction.options.getMember('user');
    const duration = interaction.options.getInteger('duration') ?? config.moderation.defaultMuteDuration;
    const reason   = interaction.options.getString('reason') || 'No reason provided';

    if (!target) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ User not found.')],
        ephemeral: true,
      });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You cannot mute yourself.')],
        ephemeral: true,
      });
    }

    if (!target.moderatable) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ I cannot mute this user.')],
        ephemeral: true,
      });
    }

    const durationMs = duration * 60_000;
    await target.timeout(durationMs, `${interaction.user.tag}: ${reason}`);

    // DM
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`🔇 You have been muted in ${interaction.guild.name}`)
      .addFields(
        { name: 'Duration',  value: `${duration} minute(s)`, inline: true },
        { name: 'Reason',    value: reason,                  inline: true },
        { name: 'Moderator', value: interaction.user.tag,    inline: true },
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🔇 Member Muted')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User',      value: `${target.user.tag} (${target.id})`, inline: true },
        { name: 'Duration',  value: `${duration} minute(s)`,             inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`,           inline: true },
        { name: 'Reason',    value: reason,                              inline: false },
        { name: 'Expires',   value: `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>`, inline: false },
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
