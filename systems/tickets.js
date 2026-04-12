'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');

const config = require('../config/config');
const db     = require('./database');

// ──────────────────────────────────────────────────────────────
//  Send Ticket Panel
// ──────────────────────────────────────────────────────────────
async function sendTicketPanel(channel, guild) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`${config.botEmoji} Support Tickets — ${guild.name}`)
    .setDescription(
      '**Need help? Open a ticket!**\n\n' +
      'Click the button below to create a **private support channel** with our staff team.\n\n' +
      '> 📋 Report a player\n' +
      '> 🛠️ Get server support\n' +
      '> ❓ Ask a question\n\n' +
      '*Please do not abuse the ticket system.*'
    )
    .setFooter({ text: 'Eight Streets Roleplay — Support System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_create')
      .setLabel('📩 Open a Ticket')
      .setStyle(ButtonStyle.Primary),
  );

  await channel.send({ embeds: [embed], components: [row] });
}

// ──────────────────────────────────────────────────────────────
//  Handle Button Interactions
// ──────────────────────────────────────────────────────────────
async function handleTicketButton(client, interaction) {
  const { customId, guild, member, user } = interaction;

  // ── Create ticket ─────────────────────────────────────────
  if (customId === 'ticket_create') {
    await interaction.deferReply({ ephemeral: true });

    const guildConfig = db.getGuildConfig(guild.id);

    // Check if user already has an open ticket
    const existingChannel = guild.channels.cache.find(
      c => c.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}` ||
           c.topic === `ticket:${user.id}`
    );

    if (existingChannel) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.warning)
            .setDescription(`❗ You already have an open ticket: ${existingChannel}`),
        ],
      });
    }

    try {
      // Build permission overwrites
      const overwrites = [
        {
          id:    guild.roles.everyone.id,
          deny:  [PermissionFlagsBits.ViewChannel],
        },
        {
          id:    user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id:    client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
        },
      ];

      // Add staff role permissions
      if (guildConfig.staffRoleId) {
        const staffRole = guild.roles.cache.get(guildConfig.staffRoleId);
        if (staffRole) {
          overwrites.push({
            id:    staffRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
          });
        }
      }

      // Find or create ticket category
      let parent = null;
      if (guildConfig.ticketCategoryId) {
        parent = guild.channels.cache.get(guildConfig.ticketCategoryId) || null;
      }

      const safeUsername = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);

      const ticketChannel = await guild.channels.create({
        name:                 `ticket-${safeUsername}`,
        type:                 ChannelType.GuildText,
        topic:                `ticket:${user.id}`,
        parent:               parent?.id || null,
        permissionOverwrites: overwrites,
        reason:               `Ticket opened by ${user.tag}`,
      });

      // Welcome message
      const welcomeEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('🎫 Ticket Created')
        .setDescription(
          `Welcome ${member}, our staff will be with you shortly!\n\n` +
          `Please describe your issue in detail so we can assist you as quickly as possible.`
        )
        .addFields(
          { name: 'Opened by', value: `${user.tag}`,       inline: true },
          { name: 'User ID',   value: user.id,             inline: true },
          { name: 'Created',   value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        )
        .setFooter({ text: 'Click "Close Ticket" when your issue is resolved.' })
        .setTimestamp();

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`ticket_close:${user.id}`)
          .setLabel('🔒 Close Ticket')
          .setStyle(ButtonStyle.Danger),
      );

      await ticketChannel.send({
        content:    `${member} ${guildConfig.staffRoleId ? `<@&${guildConfig.staffRoleId}>` : ''}`,
        embeds:     [welcomeEmbed],
        components: [closeRow],
      });

      // Log
      if (guildConfig.logChannelId) {
        const logCh = guild.channels.cache.get(guildConfig.logChannelId);
        if (logCh) {
          const logEmbed = new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('🎫 Ticket Opened')
            .addFields(
              { name: 'User',    value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Channel', value: `${ticketChannel}`,         inline: true },
            )
            .setTimestamp();
          await logCh.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.success)
            .setDescription(`✅ Your ticket has been created: ${ticketChannel}`),
        ],
      });

    } catch (err) {
      console.error('[Tickets] Error creating ticket:', err);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setDescription('❌ Failed to create ticket. Please contact staff directly.'),
        ],
      });
    }
  }

  // ── Close ticket ──────────────────────────────────────────
  if (customId.startsWith('ticket_close:')) {
    await interaction.deferReply({ ephemeral: true });

    const channel     = interaction.channel;
    const guildConfig = db.getGuildConfig(guild.id);

    // Check if this is actually a ticket channel
    if (!channel.topic?.startsWith('ticket:')) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.error)
            .setDescription('❌ This command can only be used in a ticket channel.'),
        ],
      });
    }

    const closingEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('🔒 Ticket Closing')
      .setDescription(`This ticket will be deleted in **5 seconds**.\nClosed by ${user}.`)
      .setTimestamp();

    await interaction.channel.send({ embeds: [closingEmbed] });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.success)
          .setDescription('✅ Ticket is being closed.'),
      ],
    });

    // Log
    if (guildConfig.logChannelId) {
      const logCh = guild.channels.cache.get(guildConfig.logChannelId);
      if (logCh) {
        const logEmbed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle('🔒 Ticket Closed')
          .addFields(
            { name: 'Channel',   value: channel.name,         inline: true },
            { name: 'Closed by', value: `${user.tag}`,        inline: true },
          )
          .setTimestamp();
        await logCh.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

    setTimeout(() => channel.delete().catch(() => {}), 5_000);
  }
}

module.exports = { sendTicketPanel, handleTicketButton };
