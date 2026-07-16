const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('bulk delete messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o =>
      o.setName('amount').setDescription('how many messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption(o => o.setName('user').setDescription('only delete messages from this user')),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const filterUser = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: 100 });

      if (filterUser) {
        messages = messages.filter(m => m.author.id === filterUser.id);
      }

      messages = [...messages.values()].slice(0, amount);

      // filter out messages older than 14 days (Discord limitation)
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = messages.filter(m => m.createdTimestamp > twoWeeksAgo);

      if (deletable.length === 0) {
        return interaction.editReply('no messages to delete - messages older than 14 days can\'t be bulk deleted');
      }

      const deleted = await interaction.channel.bulkDelete(deletable, true);
      await interaction.editReply(`deleted ${deleted.size} message(s)${filterUser ? ` from ${filterUser.username}` : ''}`);
    } catch (err) {
      await interaction.editReply('something went wrong deleting those messages');
      console.error('[Purge Error]', err);
    }
  }
};
