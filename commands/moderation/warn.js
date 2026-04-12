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
    .setName('warn')
    .setDescription('Issue a warning to a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(opt =>
      opt.setName('user').setDescription('The member to warn').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason for the warning').setRequired(true)
    ),

  async execute(client, interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ User not found.')],
        ephemeral: true,
      });
    }

    if (target.user.bot) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ You cannot warn a bot.')],
        ephemeral: true,
      });
    }

    const warnings = db.addWarning(interaction.guild.id, target.id, {
      moderatorId:  interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
    });

    const totalWarnings = warnings.length;

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ You have been warned in ${interaction.guild.name}`)
      .addFields(
        { name: 'Reason',          value: reason,               inline: true  },
        { name: 'Moderator',       value: interaction.user.tag, inline: true  },
        { name: 'Total Warnings',  value: `${totalWarnings}`,   inline: true  },
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⚠️ Member Warned')
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'User',           value: `${target.user.tag} (${target.id})`, inline: true  },
        { name: 'Moderator',      value: `${interaction.user.tag}`,           inline: true  },
        { name: 'Total Warnings', value: `**${totalWarnings}**`,              inline: true  },
        { name: 'Reason',         value: reason,                              inline: false },
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
