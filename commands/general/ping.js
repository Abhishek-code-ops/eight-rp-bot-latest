'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency and API response time.'),

  cooldown: 5,

  async execute(client, interaction) {
    const sent = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.info)
          .setDescription('🏓 Pinging...'),
      ],
      fetchReply: true,
    });

    const latency    = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(client.ws.ping);

    const latencyColor =
      latency < 100  ? config.colors.success  :
      latency < 300  ? config.colors.warning   :
                       config.colors.error;

    const embed = new EmbedBuilder()
      .setColor(latencyColor)
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '⚡ Round-trip',  value: `**${latency}ms**`,    inline: true },
        { name: '💡 API Latency', value: `**${apiLatency}ms**`, inline: true },
        { name: '🟢 Status',      value: '**Online**',           inline: true },
      )
      .setFooter({ text: config.botName })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
