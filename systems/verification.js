'use strict';

const { EmbedBuilder } = require('discord.js');

const pendingVerifications = new Map();

// SEND DM QUESTION
async function sendVerificationMessage(member) {
  const question = "Sharma is Noob or Pro ";

  pendingVerifications.set(member.user.id, {
    attempts: 0,
    guildId: member.guild.id,
  });

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle("Verification Required")
    .setDescription(
      `Welcome to ${member.guild.name}!\n\nAnswer this:\n**${question}**`
    );

  await member.send({ embeds: [embed] });
}

// HANDLE ANSWERS
async function handleVerificationMessage(client, message) {
  if (message.author.bot) return;

  const pending = pendingVerifications.get(message.author.id);
  if (!pending) return;

  const userAnswer = message.content.trim();

  if (userAnswer === "Noob") {
    pendingVerifications.delete(message.author.id);

    const guild = client.guilds.cache.get(pending.guildId);
    const member = guild.members.cache.get(message.author.id);

    if (!member) return;

    const role = guild.roles.cache.find(r => r.name === "Citizen");

    if (role) {
      await member.roles.add(role);
    }

    await message.reply("✅ Verified! You got access.");

  } else {
    await message.reply("❌ Wrong answer. Try again.");
  }
}

module.exports = {
  sendVerificationMessage,
  handleVerificationMessage,
};