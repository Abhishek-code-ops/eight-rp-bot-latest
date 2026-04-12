'use strict';

const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');
const db     = require('./database');

// XP required to reach a given level
function xpForLevel(level) {
  const { levelBase, levelExponent } = config.leveling;
  return Math.floor(levelBase * Math.pow(level, levelExponent));
}

// Total XP required to reach level (sum of all previous)
function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i <= level; i++) total += xpForLevel(i);
  return total;
}

// Which level does `totalXp` correspond to?
function levelFromXp(totalXp) {
  let level = 0;
  let accumulated = 0;
  while (true) {
    const needed = xpForLevel(level + 1);
    if (accumulated + needed > totalXp) break;
    accumulated += needed;
    level++;
  }
  return level;
}

// XP progress within current level
function xpProgress(totalXp) {
  const level = levelFromXp(totalXp);
  let accumulated = 0;
  for (let i = 1; i <= level; i++) accumulated += xpForLevel(i);
  const current = totalXp - accumulated;
  const needed  = xpForLevel(level + 1);
  return { current, needed, level };
}

// ──────────────────────────────────────────────────────────────
//  Progress bar builder
// ──────────────────────────────────────────────────────────────
function buildProgressBar(current, total, length = 15) {
  const filled = Math.round((current / total) * length);
  const empty  = length - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

// ──────────────────────────────────────────────────────────────
//  Handle XP gain on message
// ──────────────────────────────────────────────────────────────
async function handleXp(client, message, guildConfig) {
  const { guild, author, channel } = message;
  const { min, max }     = config.leveling.xpPerMessage;
  const cooldownMs       = config.leveling.xpCooldownMs;

  const userData = db.getUserLevel(guild.id, author.id);
  const now      = Date.now();

  // Cooldown check
  if (now - (userData.lastXp || 0) < cooldownMs) return;

  const earned = Math.floor(Math.random() * (max - min + 1)) + min;
  const oldXp  = userData.xp || 0;
  const newXp  = oldXp + Math.floor(earned * config.leveling.xpMultiplier);

  const oldLevel = levelFromXp(oldXp);
  const newLevel = levelFromXp(newXp);

  const updated = {
    xp:       newXp,
    level:    newLevel,
    lastXp:   now,
    messages: (userData.messages || 0) + 1,
  };

  db.setUserLevel(guild.id, author.id, updated);

  // Level-up notification
  if (newLevel > oldLevel) {
    const levelUpChannelId = guildConfig.levelUpChannelId || channel.id;
    const levelUpChannel   = guild.channels.cache.get(levelUpChannelId) || channel;

    const embed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle('🎉 Level Up!')
      .setThumbnail(author.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `${author} has leveled up to **Level ${newLevel}**!\n\n` +
        `Keep chatting to climb the ranks!`
      )
      .setTimestamp();

    await levelUpChannel.send({ embeds: [embed] }).catch(() => {});

    // Award level role if configured
    if (guildConfig.levelRoles) {
      const roleId = guildConfig.levelRoles[String(newLevel)];
      if (roleId) {
        const member = guild.members.cache.get(author.id);
        const role   = guild.roles.cache.get(roleId);
        if (member && role) await member.roles.add(role).catch(() => {});
      }
    }
  }
}

// ──────────────────────────────────────────────────────────────
//  Build rank embed
// ──────────────────────────────────────────────────────────────
function buildRankEmbed(user, guildId) {
  const userData = db.getUserLevel(guildId, user.id);
  const totalXp  = userData.xp   || 0;
  const messages = userData.messages || 0;
  const { current, needed, level } = xpProgress(totalXp);
  const bar = buildProgressBar(current, needed);

  return new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle(`📊 ${user.username}'s Rank`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🏅 Level',    value: `**${level}**`,       inline: true },
      { name: '✨ Total XP', value: `**${totalXp.toLocaleString()}**`, inline: true },
      { name: '💬 Messages', value: `**${messages.toLocaleString()}**`, inline: true },
      {
        name: `Progress to Level ${level + 1}`,
        value: `\`${bar}\`\n${current.toLocaleString()} / ${needed.toLocaleString()} XP`,
      },
    )
    .setTimestamp();
}

// ──────────────────────────────────────────────────────────────
//  Leaderboard
// ──────────────────────────────────────────────────────────────
function getLeaderboard(guildId, limit = 10) {
  const all = db.getAllLevels(guildId);
  return Object.entries(all)
    .map(([userId, data]) => ({ userId, xp: data.xp || 0, level: data.level || 0 }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

module.exports = {
  handleXp,
  buildRankEmbed,
  getLeaderboard,
  xpProgress,
  buildProgressBar,
  levelFromXp,
  xpForLevel,
};
