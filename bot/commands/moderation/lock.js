const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('lock a channel so members can\'t send messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption(o => o.setName('channel').setDescription('which channel to lock (default: current)')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false
    });

    await interaction.reply(`🔒 locked ${channel} - nobody can send messages in there now`);
  }
};
