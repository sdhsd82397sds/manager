const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const logging = require('../../modules/logging');

const durations = ['60s', '5m', '10m', '30m', '1h', '6h', '12h', '1d', '3d', '7d', '28d'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('timeout a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('who to timeout').setRequired(true))
    .addStringOption(o =>
      o.setName('duration')
        .setDescription('how long (e.g. 10m, 1h, 1d)')
        .setRequired(true)
        .addChoices(
          { name: '60 seconds', value: '60s' },
          { name: '5 minutes', value: '5m' },
          { name: '10 minutes', value: '10m' },
          { name: '30 minutes', value: '30m' },
          { name: '1 hour', value: '1h' },
          { name: '6 hours', value: '6h' },
          { name: '12 hours', value: '12h' },
          { name: '1 day', value: '1d' },
          { name: '3 days', value: '3d' },
          { name: '7 days', value: '7d' },
          { name: '28 days', value: '28d' },
        )
    )
    .addStringOption(o => o.setName('reason').setDescription('reason for the timeout')),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'no reason given';

    if (!target) return interaction.reply({ content: "can't find that user", ephemeral: true });
    if (!target.moderatable) return interaction.reply({ content: "i can't timeout that user", ephemeral: true });

    const duration = ms(durationStr);
    if (!duration || duration > ms('28d')) {
      return interaction.reply({ content: 'invalid duration, max is 28 days', ephemeral: true });
    }

    await target.timeout(duration, `${interaction.user.tag}: ${reason}`);

    await target.user.send(
      `you got timed out in **${interaction.guild.name}** for ${durationStr}\nreason: ${reason}`
    ).catch(() => {});

    await logging.logModerationAction(interaction.guild, null, {
      action: 'TIMEOUT',
      moderator: interaction.user,
      target: target.user,
      reason,
      duration: durationStr
    });

    const embed = new EmbedBuilder()
      .setTitle('User Timed Out')
      .setColor(0xf39c12)
      .addFields(
        { name: 'User', value: `${target.user.tag}`, inline: true },
        { name: 'Duration', value: durationStr, inline: true },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
