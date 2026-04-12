'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// ──────────────────────────────────────────────────────────────
//  Utility helpers
// ──────────────────────────────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ──────────────────────────────────────────────────────────────
//  Guild Config  — data/guilds/<guildId>.json
// ──────────────────────────────────────────────────────────────
const GUILDS_DIR = path.join(DATA_DIR, 'guilds');

function getGuildConfigPath(guildId) {
  return path.join(GUILDS_DIR, `${guildId}.json`);
}

function getGuildConfig(guildId) {
  return readJson(getGuildConfigPath(guildId));
}

function setGuildConfig(guildId, data) {
  writeJson(getGuildConfigPath(guildId), data);
}

function updateGuildConfig(guildId, updates) {
  const current = getGuildConfig(guildId);
  const merged  = { ...current, ...updates };
  setGuildConfig(guildId, merged);
  return merged;
}

// ──────────────────────────────────────────────────────────────
//  Levels  — data/levels/<guildId>.json
// ──────────────────────────────────────────────────────────────
const LEVELS_DIR = path.join(DATA_DIR, 'levels');

function getLevelsPath(guildId) {
  return path.join(LEVELS_DIR, `${guildId}.json`);
}

function getAllLevels(guildId) {
  return readJson(getLevelsPath(guildId));
}

function getUserLevel(guildId, userId) {
  const db = getAllLevels(guildId);
  return db[userId] || { xp: 0, level: 0, lastXp: 0, messages: 0 };
}

function setUserLevel(guildId, userId, data) {
  const db = getAllLevels(guildId);
  db[userId] = data;
  writeJson(getLevelsPath(guildId), db);
}

// ──────────────────────────────────────────────────────────────
//  Warnings  — data/warnings/<guildId>.json
// ──────────────────────────────────────────────────────────────
const WARNINGS_DIR = path.join(DATA_DIR, 'warnings');

function getWarningsPath(guildId) {
  return path.join(WARNINGS_DIR, `${guildId}.json`);
}

function getAllWarnings(guildId) {
  return readJson(getWarningsPath(guildId));
}

function getUserWarnings(guildId, userId) {
  const db = getAllWarnings(guildId);
  return db[userId] || [];
}

function addWarning(guildId, userId, warning) {
  const db = getAllWarnings(guildId);
  if (!db[userId]) db[userId] = [];
  db[userId].push({
    ...warning,
    id:        db[userId].length + 1,
    timestamp: Date.now(),
  });
  writeJson(getWarningsPath(guildId), db);
  return db[userId];
}

function clearWarnings(guildId, userId) {
  const db = getAllWarnings(guildId);
  db[userId] = [];
  writeJson(getWarningsPath(guildId), db);
}

// ──────────────────────────────────────────────────────────────
//  Users  — data/users/<guildId>.json
// ──────────────────────────────────────────────────────────────
const USERS_DIR = path.join(DATA_DIR, 'users');

function getUsersPath(guildId) {
  return path.join(USERS_DIR, `${guildId}.json`);
}

function getAllUsers(guildId) {
  return readJson(getUsersPath(guildId));
}

function getUser(guildId, userId) {
  const db = getAllUsers(guildId);
  return db[userId] || { verified: false, joinedAt: null };
}

function setUser(guildId, userId, data) {
  const db = getAllUsers(guildId);
  db[userId] = { ...( db[userId] || {}), ...data };
  writeJson(getUsersPath(guildId), db);
}

// ──────────────────────────────────────────────────────────────
//  Ensure base directories exist on require
// ──────────────────────────────────────────────────────────────
ensureDir(GUILDS_DIR);
ensureDir(LEVELS_DIR);
ensureDir(WARNINGS_DIR);
ensureDir(USERS_DIR);

// ──────────────────────────────────────────────────────────────
//  Exports
// ──────────────────────────────────────────────────────────────
module.exports = {
  // Guild config
  getGuildConfig,
  setGuildConfig,
  updateGuildConfig,

  // Levels
  getAllLevels,
  getUserLevel,
  setUserLevel,

  // Warnings
  getAllWarnings,
  getUserWarnings,
  addWarning,
  clearWarnings,

  // Users
  getAllUsers,
  getUser,
  setUser,
};
