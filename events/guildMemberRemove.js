'use strict';

const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../systems/logger');

module.exports = {
  name: 'guildMemberRemove',

  async execute(client, member) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("📤 Member Left")
      .setDescription(`${member.user.tag} left the server`)
      .setTimestamp();

    await sendLog(member.guild, embed);
  },
};