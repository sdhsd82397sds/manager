# Discord Bot

a full-featured Discord bot for your server with moderation, auto-mod, economy/gambling, NSFW image filter and a web dashboard

---

## what's included

- **moderation** - ban, kick, timeout, warn, purge, lock, slowmode
- **auto-mod** - anti-spam, anti-link, bad word filter, anti-caps, anti-raid, escalating punishments
- **logging** - message edits/deletes, joins, leaves, mod actions with case IDs
- **welcome system** - custom welcome/leave messages, auto-role on join
- **NSFW filter** - AI-powered image scanner, no API key needed, runs locally
- **economy/gambling** - coins, daily, slots, blackjack, coinflip, roulette, leaderboard, rob
- **web dashboard** - control everything from your browser at http://localhost:3000

---

## setup (first time)

### step 1 - get your bot token

1. go to https://discord.com/developers/applications
2. click "New Application", give it a name
3. go to the "Bot" tab, click "Add Bot"
4. copy your **Token** (keep this secret!)
5. under **Privileged Gateway Intents**, turn on:
   - Server Members Intent
   - Message Content Intent
6. go to "OAuth2" > "URL Generator":
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: Administrator (or at minimum: Manage Roles, Kick/Ban Members, Manage Messages, Moderate Members, View Audit Log)
7. copy and open the generated URL to invite the bot to your server

### step 2 - get your IDs

right-click on your server icon > "Copy Server ID" (need Developer Mode on in Discord settings)  
right-click on your app in the developer portal > copy the Application ID (this is your CLIENT_ID)

### step 3 - configure

1. copy `.env.example` to `.env`
2. fill in your details:

```
DISCORD_TOKEN=your_actual_token_here
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
DASHBOARD_PORT=3000
DASHBOARD_PASSWORD=pick_a_strong_password
SESSION_SECRET=some_random_string_here
```

### step 4 - install and run

**Option A: double-click `start.bat`** (easiest on Windows)

**Option B: manual**
```bash
npm install
node bot/deploy-commands.js   # registers slash commands (run once)
node bot/index.js             # starts the bot
node dashboard/server.js      # starts the dashboard (in a separate terminal)
```

---

## dashboard

open http://localhost:3000 in your browser and log in with your dashboard password

from there you can:
- set log channels and staff roles
- toggle and configure auto-mod features
- manage the NSFW image filter
- configure welcome messages
- view mod logs with case IDs
- manage user warnings
- set economy settings and manage balances

---

## slash commands

### moderation
| command | description |
|---|---|
| `/ban` | ban a user with reason |
| `/kick` | kick a user |
| `/timeout` | timeout 60s to 28 days |
| `/warn` | give a warning |
| `/warnings` | view someone's warnings |
| `/clearwarnings` | wipe all warnings for a user |
| `/purge` | bulk delete up to 100 messages |
| `/lock` | lock a channel |
| `/unlock` | unlock a channel |
| `/slowmode` | set slowmode 0-6h |

### utility
| command | description |
|---|---|
| `/ping` | check bot latency |
| `/userinfo` | detailed user info |
| `/serverinfo` | server stats |
| `/avatar` | get someone's avatar |

### fun
| command | description |
|---|---|
| `/poll` | create a reaction poll |
| `/8ball` | ask the magic 8ball |

### economy
| command | description |
|---|---|
| `/balance` | check your coins |
| `/daily` | claim daily coins (20h cooldown) |
| `/slots` | spin the slot machine |
| `/coinflip` | heads or tails |
| `/blackjack` | play blackjack with buttons |
| `/roulette` | bet on red/black/green/odd/even |
| `/leaderboard` | top richest users |
| `/give` | send coins to someone |
| `/rob` | try to rob someone |

---

## uploading to justrunmyapp

1. make sure your `.env` is filled in
2. zip the whole `discord-bot` folder
3. upload to justrunmyapp
4. set the start command to `node bot/index.js`
5. add your environment variables in the platform's settings panel

> note: for the dashboard on justrunmyapp, you may need to also run `node dashboard/server.js` as a second process, or check if the platform supports running multiple processes

---

## notes

- the NSFW filter loads an AI model on startup, takes a few seconds on first launch
- all data is stored in the `data/` folder as JSON files
- bot token never gets sent to the browser dashboard
- staff roles are exempt from automod and the NSFW filter
