const { SlashCommandBuilder, EmbedBuilder, RoleSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('an')
        .setDescription('Create a dynamic announcement')
        .addStringOption(o => o.setName('header').setDescription('The title (e.g., Update Notes)').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('The main text description').setRequired(true))
        .addStringOption(o => o.setName('note').setDescription('The bottom summary or final line').setRequired(true))
        .addStringOption(o => o.setName('thumbnail_url').setDescription('Link to the right-side character image').setRequired(false)),

    async execute(interaction) {
        // Show bot typing to match requested settings
        await interaction.channel.sendTyping();

        const header = interaction.options.getString('header');
        const message = interaction.options.getString('message');
        const note = interaction.options.getString('note');
        const img = interaction.options.getString('thumbnail_url');

        // Step 1: Create the standard Role Selector Component
        const roleSelect = new RoleSelectMenuBuilder()
            .setCustomId('select_announcement_role')
            .setPlaceholder('Select a role to notify (@Citizen, etc.)')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(roleSelect);

        // Step 2: Send a private prompt asking who to tag
        const prompt = await interaction.reply({
            content: "### 📢 Announcement Content Ready\nNow select the role you want to tag to send this to the channel:",
            components: [row],
            ephemeral: true // Only you can see this menu
        });

        // Step 3: Set up the Collector to listen for your role selection
        const collector = prompt.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId !== 'select_announcement_role') return;

            const selectedRoleId = i.values[0];

            // Step 4: Build the "Emble" based on your screenshot
            const announcementEmbed = new EmbedBuilder()
                .setColor('#BF40BF') // The exact hex code for Light Purple
                .setTitle(`⚠️ ${header}`)
                .setDescription(`${message}\n\nWe apologize for any temporary inconvenience`)
                .setThumbnail(img || null) // Shows the image on the right if you provide a link
                .addFields(
                    { name: '📋 Note', value: note, inline: false }
                )
                .setTimestamp();

            // Step 5: Send the final notification to the public channel
            await interaction.channel.send({
                content: `<@&${selectedRoleId}>`, // Tags the role above the box
                embeds: [announcementEmbed]
            });

            // Update the private prompt to confirm
            await i.update({ content: "✅ Announcement posted successfully!", components: [] });
        });
    }
};