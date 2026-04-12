'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');

const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Bulk delete messages from a channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (1–100)')
        .setMinValue(1).setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    ),

  async execute(client, interaction) {
    const amount    = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      // Filter by user if specified
      if (filterUser) {
        messages = messages.filter(m => m.author.id === filterUser.id);
      }

      // Only keep messages under 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      messages = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
      messages = [...messages.values()].slice(0, amount);

      if (messages.length === 0) {
        return interaction.editReply({
          embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription('⚠️ No eligible messages to delete (must be under 14 days old).')],
        });
      }

      const deleted = await interaction.channel.bulkDelete(messages, true);

      const fields = [
        { name: 'Deleted',  value: `**${deleted.size}** message(s)`, inline: true },
        { name: 'Channel',  value: `${interaction.channel}`,          inline: true },
        { name: 'By',       value: `${interaction.user.tag}`,         inline: true },
      ];
      if (filterUser) fields.push({ name: 'Filter', value: `${filterUser.tag}`, inline: true });

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🗑️ Messages Cleared')
        .addFields(fields)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Clear]', err);
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(config.colors.error).setDescription('❌ Failed to delete messages. Messages may be older than 14 days.')],
      });
    }
  },
};
