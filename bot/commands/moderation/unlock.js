const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o => o.setName('channel').setDescription('which channel to unlock (default: current)')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null
    });

    await interaction.reply(`🔓 unlocked ${channel} - people can talk again`);
  }
};
