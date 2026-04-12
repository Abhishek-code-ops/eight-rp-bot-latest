'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('View detailed information about a user.')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user to look up (defaults to you)')
        .setRequired(false)
    ),

  cooldown: 5,

  async execute(client, interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user   = target.user;

    const roles = target.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 10);

    const flags = user.flags?.toArray() || [];
    const badgeMap = {
      Staff:                   '👨‍💼 Discord Staff',
      Partner:                 '🤝 Partner',
      Hypesquad:               '🏠 HypeSquad Events',
      BugHunterLevel1:         '🐛 Bug Hunter',
      BugHunterLevel2:         '🐛 Bug Hunter Gold',
      HypeSquadOnlineHouse1:   '🏡 Bravery',
      HypeSquadOnlineHouse2:   '🏡 Brilliance',
      HypeSquadOnlineHouse3:   '🏡 Balance',
      PremiumEarlySupporter:   '⭐ Early Supporter',
      VerifiedDeveloper:       '🤖 Verified Bot Dev',
      ActiveDeveloper:         '⚙️ Active Developer',
      CertifiedModerator:      '🛡️ Certified Moderator',
    };

    const badges = flags.map(f => badgeMap[f]).filter(Boolean).join('\n') || 'None';

    const embed = new EmbedBuilder()
      .setColor(target.displayHexColor || config.colors.primary)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '🆔 User ID',       value: user.id,                                                           inline: true  },
        { name: '🤖 Bot',           value: user.bot ? 'Yes' : 'No',                                           inline: true  },
        { name: '📛 Nickname',      value: target.nickname || 'None',                                         inline: true  },
        { name: '📅 Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`, inline: true  },
        { name: '📥 Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(target.joinedTimestamp / 1000)}:R>)`, inline: true  },
        { name: '🏅 Highest Role',  value: `${target.roles.highest}`,                                         inline: true  },
        { name: `📋 Roles [${roles.length}]`, value: roles.length ? roles.join(', ') : 'None',                inline: false },
        { name: '🏆 Badges',        value: badges,                                                             inline: false },
      )
      .setImage(user.bannerURL({ dynamic: true, size: 1024 }) || null)
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
