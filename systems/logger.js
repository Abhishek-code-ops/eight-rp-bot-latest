'use strict';

const { EmbedBuilder } = require('discord.js');

function getLogChannel(guild) {
  return guild.channels.cache.find(
    c =>
      c.name === "logs" &&
      c.isTextBased() &&
      c.permissionsFor(guild.members.me).has("SendMessages")
  ) || guild.channels.cache.find(
    c => c.isTextBased() && c.permissionsFor(guild.members.me).has("SendMessages")
  );
}

async function sendLog(guild, embed) {
  const channel = getLogChannel(guild);
  if (!channel) return;

  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { sendLog };