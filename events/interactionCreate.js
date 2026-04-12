'use strict';

const { EmbedBuilder, InteractionType } = require('discord.js');
const config = require('../config/config');
const { handleTicketButton }      = require('../systems/tickets');
const { handleVerificationButton } = require('../systems/verification');

module.exports = {
  name: 'interactionCreate',

  async execute(client, interaction) {
    // ── Slash Commands ──────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Cooldown check
      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Map());
      }
      const now        = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cdAmount   = (command.cooldown ?? config.defaultCooldown) * 1_000;

      if (timestamps.has(interaction.user.id)) {
        const expireTime = timestamps.get(interaction.user.id) + cdAmount;
        if (now < expireTime) {
          const remaining = ((expireTime - now) / 1_000).toFixed(1);
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription(`⏱️ Please wait **${remaining}s** before using \`/${command.data.name}\` again.`),
            ],
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cdAmount);

      // Execute
      try {
        await command.execute(client, interaction);
      } catch (err) {
        console.error(`[Command:${interaction.commandName}]`, err);
        const errEmbed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle('❌ Command Error')
          .setDescription('An unexpected error occurred. Please try again later.')
          .setFooter({ text: `Error: ${err.message?.slice(0, 100) || 'Unknown'}` });

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
        }
      }
    }

    // ── Button Interactions ─────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id.startsWith('ticket_')) {
        await handleTicketButton(client, interaction).catch(console.error);
        return;
      }

      if (id.startsWith('verify_')) {
        await handleVerificationButton(client, interaction).catch(console.error);
        return;
      }
    }

    // ── Select Menus ────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      // future expansion
    }
  },
};
