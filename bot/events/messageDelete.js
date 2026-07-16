const logging = require('../modules/logging');

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (message.author?.bot) return;
    await logging.logMessageDelete(message, client);
  }
};
