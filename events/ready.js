'use strict';

const { ActivityType } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name:  'ready',
  once:  true,

  execute(client) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`  ${config.botEmoji}  ${config.botName} v${config.botVersion}`);
    console.log(`  Logged in as: ${client.user.tag}`);
    console.log(`  Serving ${client.guilds.cache.size} server(s)`);
    console.log(`  Commands: ${client.commands.size}`);
    console.log(`${'─'.repeat(50)}\n`);
    

    // Rotating presence
    const activities = [
      { name: '🏙️ Eight Streets Roleplay',   type: ActivityType.Playing  },
      { name: '/help for commands',           type: ActivityType.Watching },
      { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    ];

    let index = 0;
    const setPresence = () => {
      const act = activities[index % activities.length];
      client.user.setPresence({
        status:     'online',
        activities: [act],
      });
      index++;
    };

    setPresence();
    setInterval(setPresence, 30_000);
  },
};
