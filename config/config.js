'use strict';
const fs = require('fs');

// Function to get fresh data from JSON
function getDynamicConfig() {
    try {
        return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch (err) {
        return { WHITELIST_ROLE_ID: "", AUDIT_CHANNEL_ID: "", BAD_WORDS: [], userViolations: {} };
    }
}

const dynamic = getDynamicConfig();

module.exports = {
  botName: 'Eight Streets Roleplay',
  botVersion: '2.0.0',
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    error: 0xED4245,
    purple: 0xBF40BF,
    dark: 0x2B2D31,
  },
  // Spread the dynamic data into this export
  ...dynamic
};