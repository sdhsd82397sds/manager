const logging = require('../modules/logging');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMsg, newMsg, client) {
    if (newMsg.author?.bot) return;
    if (oldMsg.content === newMsg.content) return;
    await logging.logMessageEdit(oldMsg, newMsg, client);
  }
};
