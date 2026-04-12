'use strict';

const { handleVerificationMessage } = require('../systems/verification');

module.exports = {
  name: 'messageCreate',

  async execute(client, message) {
    if (message.author.bot) return;

    // ✅ HANDLE DM VERIFICATION
    if (!message.guild) {
      await handleVerificationMessage(client, message);
    }
  },
};