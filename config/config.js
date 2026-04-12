'use strict';

// ──────────────────────────────────────────────────────────────
//  Eight Streets Roleplay — Bot Configuration
// ──────────────────────────────────────────────────────────────

module.exports = {
  // ── Branding ────────────────────────────────────────────────
  botName:    'Eight Streets Roleplay',
  botVersion: '2.0.0',
  botEmoji:   '🏙️',

  // ── Embed colours ───────────────────────────────────────────
  colors: {
    primary:  0x5865F2,  // Blurple
    success:  0x57F287,  // Green
    error:    0xED4245,  // Red
    warning:  0xFEE75C,  // Yellow
    info:     0x00B0F4,  // Sky blue
    gold:     0xE3A857,  // RP gold accent
    dark:     0x2B2D31,  // Dark embed
  },

  // ── Leveling ────────────────────────────────────────────────
  leveling: {
    xpPerMessage:    { min: 15, max: 40 },  // random range
    xpCooldownMs:    60_000,                // 1 min between XP gains
    xpMultiplier:    1.0,
    // XP needed = base * level^exponent
    levelBase:       100,
    levelExponent:   1.5,
  },

  // ── Anti-Spam ───────────────────────────────────────────────
  antispam: {
    maxMessages:     5,     // messages allowed in window
    timeWindowMs:    5_000, // 5 seconds
    muteDurationMs:  60_000, // 1 minute mute
    warnBeforeMute:  true,
  },

  // ── Music ───────────────────────────────────────────────────
  music: {
    maxQueueSize:    100,
    leaveOnEmpty:    true,
    leaveTimeoutMs:  30_000, // 30s idle before leaving VC
  },

  // ── Verification defaults (overridable per guild via /setup) ──
  verification: {
    defaultQuestion: 'What is the name of this roleplay server?',
    defaultAnswer:   'eight streets roleplay',
    maxAttempts:     3,
    timeoutMs:       120_000, // 2 minutes to answer
  },

  // ── Moderation ──────────────────────────────────────────────
  moderation: {
    defaultMuteDuration: 10, // minutes
  },

  // ── Cooldowns (seconds) ─────────────────────────────────────
  defaultCooldown: 3,
};
