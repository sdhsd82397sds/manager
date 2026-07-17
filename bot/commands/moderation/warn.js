const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const automod = require('../../modules/automod');
const logging = require('../../modules/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('Who to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the warn').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) return interaction.editReply({ content: "Can't find that user." });
    if (target.id === interaction.user.id) return interaction.editReply({ content: "You can't warn yourself." });

    const warnCount = automod.addWarn(target.user.id, reason);

    await target.user.send(
      `You received a warning in **${interaction.guild.name}**\nReason: ${reason}\nYou now have ${warnCount} warning(s).`
    ).catch(() => {});

    await logging.logModerationAction(interaction.guild, null, {
      action: 'WARN',
      moderator: interaction.user,
      target: target.user,
      reason
    });

    const embed = new EmbedBuilder()
      .setTitle('Member Warned')
      .setColor(0xf1c40f)
      .addFields(
        { name: 'User', value: `${target.user.tag}`, inline: true },
        { name: 'Total Warnings', value: `${warnCount}`, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
