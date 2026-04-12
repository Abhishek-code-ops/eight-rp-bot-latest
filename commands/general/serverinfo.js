'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('View detailed information about this server.'),

  cooldown: 10,

  async execute(client, interaction) {
    const { guild } = interaction;
    await guild.fetch();

    const owner       = await guild.fetchOwner().catch(() => null);
    const channels    = guild.channels.cache;
    const textCount   = channels.filter(c => c.type === 0).size;
    const voiceCount  = channels.filter(c => c.type === 2).size;
    const catCount    = channels.filter(c => c.type === 4).size;
    const roleCount   = guild.roles.cache.size - 1; // exclude @everyone
    const emojiCount  = guild.emojis.cache.size;
    const boosts      = guild.premiumSubscriptionCount || 0;
    const boostTier   = guild.premiumTier;

    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High',
    };

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🏙️ ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .setImage(guild.bannerURL({ dynamic: true, size: 1024 }) || null)
      .addFields(
        { name: '🆔 Server ID',      value: guild.id,                                                                 inline: true },
        { name: '👑 Owner',           value: owner ? `${owner.user.tag}` : 'Unknown',                                  inline: true },
        { name: '📅 Created',         value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,                      inline: true },
        { name: '👥 Members',         value: `**${guild.memberCount}** total`,                                          inline: true },
        { name: '💬 Channels',        value: `📝 ${textCount} text · 🔊 ${voiceCount} voice · 📁 ${catCount} cat`,     inline: true },
        { name: '🎭 Roles',           value: `**${roleCount}**`,                                                        inline: true },
        { name: '😀 Emojis',          value: `**${emojiCount}**`,                                                       inline: true },
        { name: '🚀 Boosts',          value: `**${boosts}** (Tier ${boostTier})`,                                       inline: true },
        { name: '🔒 Verification',    value: verificationLevels[guild.verificationLevel] || 'Unknown',                  inline: true },
        { name: '📋 Description',     value: guild.description || 'No description set.',                                inline: false },
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
