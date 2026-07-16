const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('get info about a user')
    .addUserOption(o => o.setName('user').setDescription('who to look up (default: yourself)')),

  async execute(interaction) {
    const target = interaction.options.getMember('user') || interaction.member;
    const user = target.user;

    const roles = target.roles.cache
      .filter(r => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `${r}`)
      .slice(0, 10)
      .join(' ') || 'none';

    const accountCreated = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
    const joinedServer = `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setTitle(user.username)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setColor(target.displayHexColor || 0x5865f2)
      .addFields(
        { name: 'Display Name', value: target.displayName, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot?', value: user.bot ? 'yes' : 'no', inline: true },
        { name: 'Account Created', value: accountCreated, inline: true },
        { name: 'Joined Server', value: joinedServer, inline: true },
        { name: `Roles (${target.roles.cache.size - 1})`, value: roles }
      )
      .setFooter({ text: `requested by ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
