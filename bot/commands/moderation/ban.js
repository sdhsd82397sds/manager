const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logging = require('../../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('who to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('reason for the ban'))
    .addIntegerOption(o => o.setName('days').setDescription('delete message history (0-7 days)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'no reason given';
    const days = interaction.options.getInteger('days') || 0;

    if (!target) return interaction.reply({ content: "can't find that user", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "you can't ban yourself lol", ephemeral: true });
    if (!target.bannable) return interaction.reply({ content: "i can't ban that user, they probably have a higher role than me", ephemeral: true });

    // try to DM them first
    await target.user.send(
      `you got banned from **${interaction.guild.name}**\nreason: ${reason}`
    ).catch(() => {});

    await target.ban({ reason: `${interaction.user.tag}: ${reason}`, deleteMessageSeconds: days * 86400 });

    await logging.logModerationAction(interaction.guild, null, {
      action: 'BAN',
      moderator: interaction.user,
      target: target.user,
      reason
    });

    const embed = new EmbedBuilder()
      .setTitle('User Banned')
      .setColor(0xe74c3c)
      .addFields(
        { name: 'User', value: `${target.user.tag}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
