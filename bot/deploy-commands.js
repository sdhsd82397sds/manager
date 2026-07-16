require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { REST, Routes } = require('@discordjs/rest');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands', folder))
    .filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', folder, file));
    if (command.data) commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

module.exports = async function deployCommands() {
  try {
    console.log(`[Deploy] registering ${commands.length} slash commands...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('[Deploy] all done, commands are live now!');
  } catch (err) {
    console.error('[Deploy] something went wrong registering commands:', err);
  }
};
