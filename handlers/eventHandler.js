'use strict';

const fs   = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '..', 'events');

async function loadEvents(client) {
  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(EVENTS_DIR, file);
    try {
      const event = require(filePath);

      if (!event.name || !event.execute) {
        console.warn(`[Events] Skipping ${file} — missing name or execute.`);
        continue;
      }

      const listener = (...args) => event.execute(client, ...args);

      if (event.once) {
        client.once(event.name, listener);
      } else {
        client.on(event.name, listener);
      }

      console.log(`[Events] Registered: ${event.name}`);
    } catch (err) {
      console.error(`[Events] Error loading ${file}:`, err.message);
    }
  }
}

module.exports = { loadEvents };
