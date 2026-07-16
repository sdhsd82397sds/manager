const welcomer = require('../modules/welcomer');
const logging = require('../modules/logging');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    await welcomer.handleLeave(member, client);
    await logging.logMemberLeave(member, client);
  }
};
