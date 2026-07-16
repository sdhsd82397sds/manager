const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('set slowmode in a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName('seconds').setDescription('slowmode delay in seconds (0 = off)').setRequired(true).setMinValue(0).setMaxValue(21600)
    )
    .addChannelOption(o => o.setName('channel').setDescription('which channel (default: current)')),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.setRateLimitPerUser(seconds);

    if (seconds === 0) {
      await interaction.reply(`slowmode turned off in ${channel}`);
    } else {
      await interaction.reply(`slowmode set to ${seconds}s in ${channel}`);
    }
  }
};
