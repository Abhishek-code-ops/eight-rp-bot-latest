'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('View all available commands.')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Filter commands by category')
        .addChoices(
          { name: '📋 General',    value: 'general' },
          { name: '🔨 Moderation', value: 'moderation' },
          { name: '🎵 Music',      value: 'music' },
          { name: '🎫 Tickets',    value: 'tickets' },
          { name: '📊 Leveling',   value: 'leveling' },
          { name: '⚙️ Setup',      value: 'setup' },
        )
    ),

  cooldown: 5,

  async execute(client, interaction) {
    const category = interaction.options.getString('category');

    const categories = {
      general: {
        emoji: '📋',
        name:  'General',
        commands: [
          { name: '/ping',       desc: 'Check bot latency'         },
          { name: '/help',       desc: 'Show this menu'            },
          { name: '/userinfo',   desc: 'View user information'     },
          { name: '/serverinfo', desc: 'View server information'   },
        ],
      },
      moderation: {
        emoji: '🔨',
        name:  'Moderation',
        commands: [
          { name: '/ban',     desc: 'Ban a member from the server'     },
          { name: '/kick',    desc: 'Kick a member from the server'    },
          { name: '/mute',    desc: 'Timeout (mute) a member'         },
          { name: '/unmute',  desc: 'Remove a member\'s timeout'      },
          { name: '/clear',   desc: 'Delete messages in bulk'         },
          { name: '/warn',    desc: 'Issue a warning to a member'     },
          { name: '/warnings',desc: 'View warnings for a member'      },
        ],
      },
      music: {
        emoji: '🎵',
        name:  'Music',
        commands: [
          { name: '/play',  desc: 'Play a song by URL or search query' },
          { name: '/skip',  desc: 'Skip the current song'             },
          { name: '/stop',  desc: 'Stop music and clear the queue'    },
          { name: '/queue', desc: 'View the current music queue'      },
        ],
      },
      tickets: {
        emoji: '🎫',
        name:  'Tickets',
        commands: [
          { name: '/ticket setup', desc: 'Create the ticket panel in a channel' },
        ],
      },
      leveling: {
        emoji: '📊',
        name:  'Leveling',
        commands: [
          { name: '/rank',        desc: 'View your or another user\'s rank' },
          { name: '/leaderboard', desc: 'View the server XP leaderboard'    },
        ],
      },
      setup: {
        emoji: '⚙️',
        name:  'Setup',
        commands: [
          { name: '/setup logchannel',    desc: 'Set the log channel'             },
          { name: '/setup modlogchannel', desc: 'Set the mod log channel'         },
          { name: '/setup verification',  desc: 'Configure the verification system' },
          { name: '/setup citizenrole',   desc: 'Set the citizen role'            },
          { name: '/setup staffrole',     desc: 'Set the staff role'              },
          { name: '/setup ticketcategory',desc: 'Set the ticket category'         },
          { name: '/setup levelupchannel',desc: 'Set the level-up channel'        },
        ],
      },
    };

    if (category && categories[category]) {
      const cat = categories[category];
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`${cat.emoji} ${cat.name} Commands`)
        .setDescription(
          cat.commands
            .map(c => `\`${c.name}\` — ${c.desc}`)
            .join('\n')
        )
        .setFooter({ text: `${config.botName} • Use /help for all categories` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Show all categories overview
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${config.botEmoji} ${config.botName} — Command Help`)
      .setDescription(
        'Below are all available command categories.\n' +
        'Use `/help [category]` for detailed command info.\n'
      )
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    for (const [, cat] of Object.entries(categories)) {
      embed.addFields({
        name:  `${cat.emoji} ${cat.name}`,
        value: cat.commands.map(c => `\`${c.name}\``).join(', '),
      });
    }

    embed.setFooter({ text: `v${config.botVersion} • /help [category] for details` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
