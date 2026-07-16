const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const automod = require('../../modules/automod');
const logging = require('../../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('who to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('reason for the warn').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) return interaction.reply({ content: "can't find that user", ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ content: "you can't warn yourself lol", ephemeral: true });

    const warnCount = automod.addWarn(target.user.id, reason);

    await target.user.send(
      `you got a warning in **${interaction.guild.name}**\nreason: ${reason}\nyou now have ${warnCount} warning(s)`
    ).catch(() => {});

    await logging.logModerationAction(interaction.guild, null, {
      action: 'WARN',
      moderator: interaction.user,
      target: target.user,
      reason
    });

    const embed = new EmbedBuilder()
      .setTitle('User Warned')
      .setColor(0xf1c40f)
      .addFields(
        { name: 'User', value: `${target.user.tag}`, inline: true },
        { name: 'Total Warnings', value: `${warnCount}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
