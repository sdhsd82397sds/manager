const welcomer = require('../modules/welcomer');
const logging = require('../modules/logging');
const economy = require('../modules/economy');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    await welcomer.handleJoin(member, client);
    await logging.logMemberJoin(member, client);
    // give starting coins if they dont have an account yet
    economy.ensureUser(member.id);
  }
};
