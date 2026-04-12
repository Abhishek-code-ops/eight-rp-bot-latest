'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const config = require('../../config/config');
const { sendTicketPanel } = require('../../systems/tickets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket system management.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Send the ticket panel to a channel.')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('Channel to send the ticket panel in')
            .setRequired(true)
        )
    ),

  async execute(client, interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');

      try {
        await sendTicketPanel(channel, interaction.guild);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.success)
              .setTitle('✅ Ticket Panel Created')
              .setDescription(`The ticket panel has been sent to ${channel}.`)
              .setTimestamp(),
          ],
          ephemeral: true,
        });
      } catch (err) {
        console.error('[Ticket Setup]', err);
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.error)
              .setDescription('❌ Failed to create the ticket panel. Check my permissions in that channel.'),
          ],
          ephemeral: true,
        });
      }
    }
  },
};
