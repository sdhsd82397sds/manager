const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logging = require('../../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('who to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('reason for the kick')),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') || 'no reason given';

    if (!target) return interaction.reply({ content: "can't find that user", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "you can't kick yourself lol", ephemeral: true });
    if (!target.kickable) return interaction.reply({ content: "i can't kick that user, check my role position", ephemeral: true });

    await target.user.send(
      `you got kicked from **${interaction.guild.name}**\nreason: ${reason}`
    ).catch(() => {});

    await target.kick(`${interaction.user.tag}: ${reason}`);

    await logging.logModerationAction(interaction.guild, null, {
      action: 'KICK',
      moderator: interaction.user,
      target: target.user,
      reason
    });

    const embed = new EmbedBuilder()
      .setTitle('User Kicked')
      .setColor(0xe67e22)
      .addFields(
        { name: 'User', value: `${target.user.tag}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
