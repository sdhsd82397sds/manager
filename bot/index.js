require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// load all commands from subfolders
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands', folder))
    .filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

// load all events
const eventFiles = fs
  .readdirSync(path.join(__dirname, 'events'))
  .filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(__dirname, 'events', file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// auto-deploy slash commands on boot
const deployCommands = require('./deploy-commands');

(async () => {
  await deployCommands();
  
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[Bot] failed to login:', err.message);
    console.error('[Bot] double check your DISCORD_TOKEN in .env');
    process.exit(1);
  });
})();

module.exports = client;
