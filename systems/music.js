'use strict';

const {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} = require('@discordjs/voice');

const playdl = require('play-dl');
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

// ──────────────────────────────────────────────────────────────
//  Guild Queue structure
// ──────────────────────────────────────────────────────────────
function createGuildQueue(voiceChannel, textChannel) {
  return {
    voiceChannel,
    textChannel,
    connection:  null,
    player:      null,
    songs:       [],
    volume:      80,
    playing:     false,
    idleTimer:   null,
  };
}

// ──────────────────────────────────────────────────────────────
//  Get song info from URL or search query
// ──────────────────────────────────────────────────────────────
async function getSongInfo(query) {
  try {
    let url = query;

    // Check if it's a search query
    const ytUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!ytUrlPattern.test(query)) {
      const results = await playdl.search(query, { limit: 1 });
      if (!results || results.length === 0) return null;
      url = results[0].url;
    }

    const info = await playdl.video_info(url);
    if (!info) return null;

    const video = info.video_details;
    return {
      title:     video.title     || 'Unknown Title',
      url:       video.url,
      duration:  video.durationRaw || '0:00',
      durationMs: video.durationInSec * 1000,
      thumbnail: video.thumbnails?.[0]?.url || null,
      channel:   video.channel?.name || 'Unknown',
    };
  } catch (err) {
    console.error('[Music] getSongInfo error:', err.message);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
//  Play next song in queue
// ──────────────────────────────────────────────────────────────
async function playNext(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue || queue.songs.length === 0) {
    // Start idle timeout then disconnect
    if (queue) {
      clearTimeout(queue.idleTimer);
      queue.idleTimer = setTimeout(() => {
        destroyQueue(client, guildId);
      }, config.music.leaveTimeoutMs);
    }
    return;
  }

  const song = queue.songs[0];

  try {
    const stream = await playdl.stream(song.url, { quality: 2 });
    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
      inlineVolume: true,
    });

    resource.volume?.setVolume(queue.volume / 100);
    queue.player.play(resource);
    queue.playing = true;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('🎵 Now Playing')
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Title',    value: `[${song.title}](${song.url})`, inline: false },
        { name: 'Duration', value: song.duration,   inline: true  },
        { name: 'Channel',  value: song.channel,    inline: true  },
        { name: 'Queue',    value: `${queue.songs.length} song(s)`, inline: true },
      )
      .setTimestamp();

    await queue.textChannel.send({ embeds: [embed] }).catch(() => {});
  } catch (err) {
    console.error('[Music] playNext error:', err.message);
    queue.songs.shift();

    const errEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setDescription(`❌ Failed to play **${song.title}**. Skipping...`);

    await queue.textChannel.send({ embeds: [errEmbed] }).catch(() => {});
    await playNext(client, guildId);
  }
}

// ──────────────────────────────────────────────────────────────
//  Connect voice + set up player
// ──────────────────────────────────────────────────────────────
async function connectAndPlay(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return;

  // Connect to voice channel
  const connection = joinVoiceChannel({
    channelId:      queue.voiceChannel.id,
    guildId:        guildId,
    adapterCreator: queue.voiceChannel.guild.voiceAdapterCreator,
    selfDeaf:       true,
  });

  queue.connection = connection;

  // Create player
  const player = createAudioPlayer();
  queue.player  = player;

  connection.subscribe(player);

  // Player events
  player.on(AudioPlayerStatus.Idle, () => {
    const q = client.musicQueues.get(guildId);
    if (!q) return;
    q.songs.shift();
    playNext(client, guildId);
  });

  player.on('error', (err) => {
    console.error('[Music] Player error:', err.message);
    const q = client.musicQueues.get(guildId);
    if (!q) return;
    q.songs.shift();
    playNext(client, guildId);
  });

  // Connection events
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      destroyQueue(client, guildId);
    }
  });

  // Wait for connection to be ready
  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  } catch (err) {
    console.error('[Music] Connection failed:', err.message);
    destroyQueue(client, guildId);
    return;
  }

  await playNext(client, guildId);
}

// ──────────────────────────────────────────────────────────────
//  Destroy and clean up queue
// ──────────────────────────────────────────────────────────────
function destroyQueue(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return;

  clearTimeout(queue.idleTimer);

  if (queue.player) {
    queue.player.stop(true);
  }

  const connection = getVoiceConnection(guildId);
  if (connection) connection.destroy();

  client.musicQueues.delete(guildId);
}

// ──────────────────────────────────────────────────────────────
//  Public API
// ──────────────────────────────────────────────────────────────

async function play(client, interaction, query) {
  const voiceChannel = interaction.member.voice.channel;

  if (!voiceChannel) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.error)
          .setDescription('❌ You must be in a voice channel to play music!'),
      ],
    });
  }

  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(config.colors.info)
        .setDescription(`🔍 Searching for: **${query}**...`),
    ],
  });

  const song = await getSongInfo(query);

  if (!song) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.error)
          .setDescription('❌ Could not find that song. Try a different search or URL.'),
      ],
    });
  }

  const guildId = interaction.guild.id;
  let queue     = client.musicQueues.get(guildId);

  if (!queue) {
    queue = createGuildQueue(voiceChannel, interaction.channel);
    client.musicQueues.set(guildId, queue);
  }

  if (queue.songs.length >= config.music.maxQueueSize) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.error)
          .setDescription(`❌ Queue is full (max ${config.music.maxQueueSize} songs).`),
      ],
    });
  }

  queue.songs.push(song);

  if (!queue.playing || !queue.player || queue.player.state.status === AudioPlayerStatus.Idle) {
    queue.playing = false;
    await connectAndPlay(client, guildId);
  } else {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.success)
          .setTitle('✅ Added to Queue')
          .addFields(
            { name: 'Song',     value: `[${song.title}](${song.url})`, inline: false },
            { name: 'Duration', value: song.duration,   inline: true },
            { name: 'Position', value: `#${queue.songs.length}`, inline: true },
          )
          .setThumbnail(song.thumbnail)
          .setTimestamp(),
      ],
    });
  }
}

function skip(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue || !queue.player) return false;
  queue.player.stop();
  return true;
}

function stop(client, guildId) {
  const queue = client.musicQueues.get(guildId);
  if (!queue) return false;
  queue.songs = [];
  destroyQueue(client, guildId);
  return true;
}

function getQueue(client, guildId) {
  return client.musicQueues.get(guildId) || null;
}

module.exports = { play, skip, stop, getQueue, destroyQueue };
