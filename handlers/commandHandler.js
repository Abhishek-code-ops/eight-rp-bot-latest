'use strict';

const fs      = require('fs');
const path    = require('path');
const { REST, Routes } = require('@discordjs/rest');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

// ──────────────────────────────────────────────────────────────
//  Recursively collect all command files
// ──────────────────────────────────────────────────────────────
function collectCommandFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCommandFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ──────────────────────────────────────────────────────────────
//  Load commands into client.commands + register with Discord
// ──────────────────────────────────────────────────────────────
async function loadCommands(client) {
  const commandFiles = collectCommandFiles(COMMANDS_DIR);
  const slashData    = [];

  for (const filePath of commandFiles) {
    try {
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.warn(`[Commands] Skipping ${path.basename(filePath)} — missing data or execute.`);
        continue;
      }

      client.commands.set(command.data.name, command);
      slashData.push(command.data.toJSON());
      console.log(`[Commands] Loaded: /${command.data.name}`);
    } catch (err) {
      console.error(`[Commands] Error loading ${filePath}:`, err.message);
    }
  }

  // Register slash commands globally
  try {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    console.log(`[Commands] Registering ${slashData.length} slash commands...`);

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: slashData }
    );

    console.log('[Commands] All slash commands registered globally ✓');
  } catch (err) {
    console.error('[Commands] Failed to register slash commands:', err.message);
  }
}

module.exports = { loadCommands };
