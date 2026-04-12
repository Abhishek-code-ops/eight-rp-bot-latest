'use strict';

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];

// 🔥 LOAD ALL COMMANDS (recursive)
function loadCommands(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.lstatSync(fullPath).isDirectory()) {
      loadCommands(fullPath);
    } else if (file.endsWith('.js')) {
      const command = require(fullPath);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

loadCommands(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} commands...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Commands registered!');
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
})();