const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Admin configuration')
        .addSubcommand(s => s.setName('setaudit').setDescription('Set log channel').addChannelOption(o => o.setName('channel').setRequired(true)))
        .addSubcommand(s => s.setName('setblword').setDescription('Add bad word').addStringOption(o => o.setName('word').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.channel.sendTyping();
        const sub = interaction.options.getSubcommand();

        if (sub === 'setaudit') {
            const chan = interaction.options.getChannel('channel');
            config.AUDIT_CHANNEL_ID = chan.id;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            return interaction.reply(`✅ Audit logs will now be sent to ${chan}`);
        }

        if (sub === 'setblword') {
            const word = interaction.options.getString('word').toLowerCase();
            if (!config.BAD_WORDS.includes(word)) config.BAD_WORDS.push(word);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
            return interaction.reply(`🚫 Added **${word}** to the auto-mod list.`);
        }
    }
};