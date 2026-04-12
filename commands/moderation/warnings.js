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
    .setName('warnings')
    .setDescription('View or clear warnings for a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('View a member\'s warnings')
        .addUserOption(opt =>
          opt.setName('user').setDescription('The member to check').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Clear all warnings for a member')
        .addUserOption(opt =>
          opt.setName('user').setDescription('The member to clear').setRequired(true)
        )
    ),

  async execute(client, interaction) {
    const sub    = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');

    if (sub === 'view') {
      const warns = db.getUserWarnings(interaction.guild.id, target.id);

      if (warns.length === 0) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.success)
              .setDescription(`✅ **${target.tag}** has no warnings.`),
          ],
          ephemeral: true,
        });
      }

      const warnList = warns
        .slice(-10) // Show last 10 warnings
        .map(w =>
          `**#${w.id}** — <t:${Math.floor(w.timestamp / 1000)}:R>\n` +
          `└ ${w.reason} *(by <@${w.moderatorId}>)*`
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(`⚠️ Warnings for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setDescription(warnList)
        .setFooter({ text: `Total: ${warns.length} warning(s)` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'clear') {
      db.clearWarnings(interaction.guild.id, target.id);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Warnings Cleared')
        .setDescription(`All warnings for **${target.tag}** have been removed by ${interaction.user}.`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
