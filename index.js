require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require('discord.js');

const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents }   = require('./handlers/eventHandler');

// ──────────────────────────────────────────────────────────────
//  Client
// ──────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.Reaction,
  ],
});
const { DisTube } = require('distube');
const { YouTubePlugin } = require('@distube/youtube');

client.distube = new DisTube(client, {
  plugins: [new YouTubePlugin()],
});

client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel.send(`🎶 Playing: ${song.name}`);
  })
  .on('addSong', (queue, song) => {
    queue.textChannel.send(`➕ Added: ${song.name}`);
  })
  .on('error', (channel, error) => {
    console.error(error);
    channel.send('❌ Music error occurred');
  });
// ──────────────────────────────────────────────────────────────
//  Collections
// ──────────────────────────────────────────────────────────────
client.commands   = new Collection(); // name  → command module
client.cooldowns  = new Collection(); // name  → userID → timestamp
client.musicQueues = new Map();        // guildID → GuildQueue

// ──────────────────────────────────────────────────────────────
//  Boot
// ──────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('[Boot] Loading commands...');
    await loadCommands(client);

    console.log('[Boot] Loading events...');
    await loadEvents(client);

    console.log('[Boot] Logging in...');
    await client.login(process.env.DISCORD_TOKEN);
  } catch (err) {
    console.error('[Boot] Fatal error:', err);
    process.exit(1);
  }
})();

// ──────────────────────────────────────────────────────────────
//  Global error guards
// ──────────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) =>
  console.error('[UnhandledRejection]', err)
);
process.on('uncaughtException', (err) =>
  console.error('[UncaughtException]', err)
);
