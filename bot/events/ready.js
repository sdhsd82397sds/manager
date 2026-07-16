const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    const totalMembers = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
    console.log(`[Bot] online as ${client.user.tag}`);
    console.log(`[Bot] watching over ${totalMembers} members across ${client.guilds.cache.size} server(s)`);

    const statuses = [
      { name: 'over the server', type: ActivityType.Watching },
      { name: `${totalMembers} members`, type: ActivityType.Watching },
      { name: '/help for commands', type: ActivityType.Listening },
      { name: 'out for rule breakers', type: ActivityType.Watching },
    ];

    let i = 0;
    client.user.setPresence({ activities: [statuses[0]], status: 'online' });
    setInterval(() => {
      i = (i + 1) % statuses.length;
      client.user.setPresence({ activities: [statuses[i]], status: 'online' });
    }, 20000);
  }
};
