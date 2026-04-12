# 🏙️ Eight Streets Roleplay — Discord Bot

A professional, feature-rich Discord bot built with **discord.js v14** for the Eight Streets Roleplay server.

---

## 📋 Features

| System          | Commands / Features                                  |
|-----------------|------------------------------------------------------|
| 🔨 Moderation   | `/ban`, `/kick`, `/mute`, `/unmute`, `/clear`, `/warn`, `/warnings` |
| ✅ Verification  | Auto-challenge on join, role reward on pass          |
| 🎫 Tickets      | Panel with buttons, private channels, close button   |
| 🎵 Music        | `/play`, `/skip`, `/stop`, `/queue` (YouTube)        |
| 📊 Leveling     | XP per message, level-up alerts, `/rank`, `/leaderboard` |
| 🛡️ Anti-Spam   | Auto-warn + timeout on spam detection                |
| 📋 Logging      | Join/leave, mod actions                              |
| ⚙️ Setup        | Full per-guild configuration via `/setup`            |
| 📦 General      | `/help`, `/ping`, `/userinfo`, `/serverinfo`         |

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js v20+** — [Download](https://nodejs.org)
- A Discord bot application — [Create one here](https://discord.com/developers/applications)
- **FFmpeg** is handled automatically by `ffmpeg-static`

### 2. Clone & Install

```bash
# Clone or download the project folder
cd eight-streets-bot

# Install all dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and fill in your values:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_client_id_here
OWNER_ID=your_discord_user_id_here
```

**How to get these values:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application → **Bot** tab → Copy **Token** → `DISCORD_TOKEN`
3. **General Information** tab → Copy **Application ID** → `CLIENT_ID`
4. Your personal Discord User ID (Enable Dev Mode → right-click your name → Copy ID) → `OWNER_ID`

### 4. Bot Permissions

When inviting the bot, use this permission set:
- Administrator *(recommended for full functionality)*

Or invite with this URL (replace `CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 5. Run the Bot

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

---

## ⚙️ Server Setup (First Time)

After the bot joins your server, run these slash commands as an admin:

```
/setup logchannel      #logs         ← join/leave logs
/setup modlogchannel   #mod-logs     ← moderation action logs
/setup staffrole       @Staff        ← who can see tickets
/setup citizenrole     @Citizen      ← role given after verification
/setup ticketcategory  Tickets       ← category for ticket channels
/setup levelupchannel  #general      ← where level-up messages appear

/setup verification
  channel:  #verify
  question: What is the name of this roleplay server?
  answer:   eight streets roleplay
```

Then post the ticket panel:
```
/ticket setup  channel: #support
```

View your full config at any time:
```
/setup view
```

---

## 📁 Project Structure

```
eight-streets-bot/
├── index.js                    ← Entry point
├── package.json
├── .env                        ← Your secrets (never commit!)
├── .env.example
│
├── config/
│   └── config.js               ← Bot-wide settings & colors
│
├── handlers/
│   ├── commandHandler.js       ← Loads + registers slash commands
│   └── eventHandler.js         ← Loads event listeners
│
├── events/
│   ├── ready.js
│   ├── interactionCreate.js
│   ├── messageCreate.js
│   ├── guildMemberAdd.js
│   └── guildMemberRemove.js
│
├── systems/
│   ├── database.js             ← JSON file-based storage
│   ├── leveling.js             ← XP/level logic
│   ├── antispam.js             ← Spam detection
│   ├── music.js                ← Audio player + queue
│   ├── tickets.js              ← Ticket panel + channel logic
│   └── verification.js         ← Join verification flow
│
├── commands/
│   ├── general/
│   │   ├── ping.js
│   │   ├── help.js
│   │   ├── userinfo.js
│   │   └── serverinfo.js
│   ├── moderation/
│   │   ├── ban.js
│   │   ├── kick.js
│   │   ├── mute.js
│   │   ├── unmute.js
│   │   ├── clear.js
│   │   ├── warn.js
│   │   └── warnings.js
│   ├── music/
│   │   ├── play.js
│   │   ├── skip.js
│   │   ├── stop.js
│   │   └── queue.js
│   ├── leveling/
│   │   ├── rank.js
│   │   └── leaderboard.js
│   ├── tickets/
│   │   └── ticket.js
│   └── setup/
│       └── setup.js
│
└── data/                       ← Auto-created, JSON storage
    ├── guilds/                 ← Per-guild config
    ├── users/                  ← Per-guild user data
    ├── warnings/               ← Per-guild warnings
    └── levels/                 ← Per-guild XP/level data
```

---

## 🎛️ Configuration (`config/config.js`)

| Setting | Default | Description |
|---------|---------|-------------|
| `leveling.xpPerMessage` | 15–40 | Random XP range per message |
| `leveling.xpCooldownMs` | 60,000 | Milliseconds between XP gains |
| `antispam.maxMessages` | 5 | Messages before spam triggers |
| `antispam.timeWindowMs` | 5,000 | Detection window in ms |
| `antispam.muteDurationMs` | 60,000 | Auto-mute duration in ms |
| `music.maxQueueSize` | 100 | Max songs in queue |
| `music.leaveTimeoutMs` | 30,000 | Idle disconnect timeout |
| `verification.maxAttempts` | 3 | Attempts before failing verification |
| `verification.timeoutMs` | 120,000 | Time to answer verification |

---

## 🔒 Required Bot Permissions

| Permission | Used For |
|------------|----------|
| Send Messages | All responses |
| Manage Messages | Bulk delete (`/clear`), verification channel cleanup |
| Embed Links | All embeds |
| Read Message History | `/clear`, verification |
| Manage Channels | Creating/deleting ticket channels |
| Manage Roles | Assigning Citizen role, level roles |
| Moderate Members | Timeouts (`/mute`) |
| Ban Members | `/ban` |
| Kick Members | `/kick` |
| Connect / Speak | Music in voice channels |
| View Channels | General access |

---

## 🛠️ Troubleshooting

**Commands not showing up?**
- Slash commands can take up to 1 hour to propagate globally.
- For instant registration in one guild, update `commandHandler.js` to use `Routes.applicationGuildCommands(clientId, guildId)`.

**Music not playing?**
- Ensure the bot has `Connect` and `Speak` permissions in the voice channel.
- Make sure you're in a voice channel before using `/play`.

**Verification not working?**
- Run `/setup verification` to configure the question, answer, and channel.
- Run `/setup citizenrole` to configure what role is given on success.

**Bot offline / won't start?**
- Double-check your `.env` values.
- Ensure you're running Node.js v20+: `node --version`
