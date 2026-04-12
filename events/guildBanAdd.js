'use strict';

const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../systems/logger');

module.exports = {
  name: 'guildBanAdd',

  async execute(client, ban) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("🔨 User Banned")
      .setDescription(`${ban.user.tag} was banned`)
      .setTimestamp();

    await sendLog(ban.guild, embed);
  },
};