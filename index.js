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

const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

const client = new Client({
    intents: [3276799] // Includes all necessary intents
});

// Helper for LoggerBot style embeds
async function sendLog(guild, embed) {
    const channel = guild.channels.cache.get(config.AUDIT_CHANNEL_ID);
    if (channel) channel.send({ embeds: [embed.setTimestamp()] });
}

// SCALING TIMEOUT FUNCTION
async function applyPunishment(message, reason) {
    const userId = message.author.id;
    if (!config.userViolations) config.userViolations = {};
    if (!config.userViolations[userId]) config.userViolations[userId] = 0;

    config.userViolations[userId]++;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    const count = config.userViolations[userId];
    let duration = 7200000; // Default 2h
    let label = "2 Hours";

    if (count === 2) { duration = 36000000; label = "10 Hours"; }
    else if (count === 3) { duration = 86400000; label = "24 Hours"; }
    else if (count >= 4) { duration = 604800000; label = "7 Days"; }

    try {
        await message.member.timeout(duration, reason);
        const log = new EmbedBuilder()
            .setAuthor({ name: "Auto-Mod Action", iconURL: message.author.displayAvatarURL() })
            .setColor("#BF40BF")
            .setDescription(`**User:** ${message.author}\n**Action:** Timeout (${label})\n**Reason:** ${reason}\n**Violation Count:** ${count}`);
        
        sendLog(message.guild, log);
        await message.author.send(`You have been timed out for ${label} due to: ${reason}`).catch(() => null);
    } catch (e) { console.error("Could not timeout user.") }
}

// MESSAGE EVENTS (Links & Words)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    const isWhitelisted = message.member.roles.cache.has(config.WHITELIST_ROLE_ID);
    if (isWhitelisted) return;

    // Link Detection
    if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
        await message.delete();
        return applyPunishment(message, "Posting Links");
    }

    // Bad Word Detection
    const hasBadWord = config.BAD_WORDS.some(w => message.content.toLowerCase().includes(w));
    if (hasBadWord) {
        await message.delete();
        return applyPunishment(message, "Abusive Language");
    }
});

// LOGGERBOT STYLE LOGS
client.on('messageUpdate', (oldM, newM) => {
    if (oldM.author.bot || oldM.content === newM.content) return;
    const log = new EmbedBuilder()
        .setAuthor({ name: "Message Edited", iconURL: oldM.author.displayAvatarURL() })
        .setColor("#3498db")
        .addFields(
            { name: "Channel", value: `${oldM.channel}`, inline: true },
            { name: "User", value: `${oldM.author}`, inline: true },
            { name: "Before", value: oldM.content || "Empty" },
            { name: "After", value: newM.content || "Empty" }
        );
    sendLog(oldM.guild, log);
});

client.on('messageDelete', (m) => {
    if (m.author?.bot) return;
    const log = new EmbedBuilder()
        .setAuthor({ name: "Message Deleted", iconURL: m.author?.displayAvatarURL() })
        .setColor("#e74c3c")
        .addFields(
            { name: "Channel", value: `${m.channel}`, inline: true },
            { name: "User", value: `${m.author}`, inline: true },
            { name: "Content", value: m.content || "No text/Media" }
        );
    sendLog(m.guild, log);
});

client.on('guildMemberUpdate', (oldM, newM) => {
    const added = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id));
    const removed = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id));
    
    if (added.size > 0 || removed.size > 0) {
        const log = new EmbedBuilder()
            .setAuthor({ name: "Member Roles Updated", iconURL: newM.user.displayAvatarURL() })
            .setColor("#f1c40f")
            .setDescription(`**Target:** ${newM.user}`);

        added.forEach(r => log.addFields({ name: "Role Added", value: `<@&${r.id}>`, inline: true }));
        removed.forEach(r => log.addFields({ name: "Role Removed", value: `<@&${r.id}>`, inline: true }));
        sendLog(newM.guild, log);
    }
    client.on('guildBanAdd', async (ban) => {
    const log = new EmbedBuilder()
        .setAuthor({ name: "User Banned", iconURL: ban.user.displayAvatarURL() })
        .setColor("#ff0000") // Red
        .setDescription(`**User:** ${ban.user.tag}\n**ID:** ${ban.user.id}`)
        .setFooter({ text: "Manual Ban Detected" });
    
    sendLog(ban.guild, log);
});
});
    


client.login('YOUR_TOKEN');