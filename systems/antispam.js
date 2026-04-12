'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const db     = require('./database');

// guildId -> userId -> { messages: [{timestamp}], warned: bool }
const spamTracker = new Map();

function getTracker(guildId, userId) {
  const key = `${guildId}:${userId}`;
  if (!spamTracker.has(key)) {
    spamTracker.set(key, { messages: [], warned: false });
  }
  return spamTracker.get(key);
}

function resetTracker(guildId, userId) {
  spamTracker.delete(`${guildId}:${userId}`);
}

// ──────────────────────────────────────────────────────────────
//  Spam detection main handler
// ──────────────────────────────────────────────────────────────
async function handleAntiSpam(client, message, guildConfig) {
  // Skip bots, admins, and members with manage_messages
  if (message.author.bot) return;
  if (!message.guild)     return;

  const member = message.member;
  if (!member) return;

  // Bypass for staff
  if (
    member.permissions.has('Administrator') ||
    member.permissions.has('ManageMessages') ||
    member.permissions.has('ManageGuild')
  ) return;

  const { maxMessages, timeWindowMs, muteDurationMs, warnBeforeMute } = config.antispam;
  const guildId  = message.guild.id;
  const userId   = message.author.id;
  const now      = Date.now();
  const tracker  = getTracker(guildId, userId);

  // Record message
  tracker.messages.push(now);

  // Purge old timestamps outside window
  tracker.messages = tracker.messages.filter(t => now - t < timeWindowMs);

  if (tracker.messages.length >= maxMessages) {
    // Delete the spam message
    await message.delete().catch(() => {});

    if (warnBeforeMute && !tracker.warned) {
      // First offence: warn
      tracker.warned = true;

      const warnEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('⚠️ Spam Warning')
        .setDescription(
          `${message.author}, please slow down! ` +
          `Continued spamming will result in a timeout.`
        )
        .setTimestamp();

      const warnMsg = await message.channel.send({ embeds: [warnEmbed] }).catch(() => null);
      if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 8_000);

      // Log warning
      db.addWarning(guildId, userId, {
        moderatorId: client.user.id,
        reason:      'Auto-warn: spam detected',
      });

    } else {
      // Apply timeout (mute)
      try {
        await member.timeout(muteDurationMs, 'Auto-mute: spam detected');

        const muteEmbed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle('🔇 Auto-Muted for Spam')
          .setDescription(
            `${message.author} has been muted for **${muteDurationMs / 60_000} minute(s)** ` +
            `due to spam.`
          )
          .setTimestamp();

        await message.channel.send({ embeds: [muteEmbed] }).catch(() => {});

        // Send DM
        const dmEmbed = new EmbedBuilder()
          .setColor(config.colors.error)
          .setTitle('🔇 You have been muted')
          .setDescription(
            `You were automatically muted in **${message.guild.name}** ` +
            `for ${muteDurationMs / 60_000} minute(s) due to spamming.`
          );
        await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

        // Log
        if (guildConfig.modLogChannelId) {
          const logChannel = message.guild.channels.cache.get(guildConfig.modLogChannelId);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setColor(config.colors.error)
              .setTitle('🔇 Auto-Mute (Spam)')
              .addFields(
                { name: 'User',     value: `${message.author.tag} (${userId})`, inline: true },
                { name: 'Duration', value: `${muteDurationMs / 60_000}m`,       inline: true },
                { name: 'Reason',   value: 'Auto-mute: spam detected',          inline: true },
              )
              .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }

        resetTracker(guildId, userId);
      } catch (err) {
        console.error('[AntiSpam] Failed to timeout member:', err.message);
      }
    }
  }
}

module.exports = { handleAntiSpam };
