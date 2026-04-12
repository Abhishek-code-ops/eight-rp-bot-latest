'use strict';

const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../systems/logger');

module.exports = {
  name: 'messageDelete',

  async execute(client, message) {
    if (!message.guild || !message.author) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("🗑️ Message Deleted")
      .addFields(
        { name: "User", value: message.author.tag, inline: true },
        { name: "Channel", value: `<#${message.channel.id}>`, inline: true },
        { name: "Content", value: message.content || "No content" }
      )
      .setTimestamp();

    await sendLog(message.guild, embed);
  },
};