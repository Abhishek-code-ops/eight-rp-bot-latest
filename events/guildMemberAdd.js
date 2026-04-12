'use strict';

const { sendVerificationMessage } = require('../systems/verification');
const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../systems/logger');

module.exports = {
  name: 'guildMemberAdd',

  async execute(client, member) {
    console.log("🔥 guildMemberAdd triggered for:", member.user.tag);

    // DM verification
    await sendVerificationMessage(member).catch(() => {});

    // LOG JOIN
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("📥 Member Joined")
      .setDescription(`${member.user.tag} joined the server`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    await sendLog(member.guild, embed);
  },
};