const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    console.log(`[Bot] online as ${client.user.tag}`);
    console.log(`[Bot] watching over ${totalMembers} members across ${client.guilds.cache.size} server(s)`);

    const updateStatus = async () => {
      try {
        const guild = await client.guilds.fetch('1235995689750761482');
        client.user.setPresence({
          activities: [{ name: `${guild.memberCount} members`, type: ActivityType.Watching }],
          status: 'online'
        });
      } catch (err) {
        console.error('[Status] could not fetch guild for member count update');
      }
    };

    updateStatus();
    setInterval(updateStatus, 60000);
  }
};
