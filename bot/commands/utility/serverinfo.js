const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('get info about the server'),

  async execute(interaction) {
    const guild = interaction.guild;
    await guild.fetch();

    const online = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const bots = guild.members.cache.filter(m => m.user.bot).size;
    const created = `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`;
    const channels = guild.channels.cache;
    const text = channels.filter(c => c.type === 0).size;
    const voice = channels.filter(c => c.type === 2).size;

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setColor(0x5865f2)
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Created', value: created, inline: true },
        { name: 'Members', value: `${guild.memberCount} (${bots} bots)`, inline: true },
        { name: 'Channels', value: `${text} text, ${voice} voice`, inline: true },
        { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
        { name: 'Boost Level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`, inline: true },
        { name: 'Verification Level', value: `${guild.verificationLevel}`, inline: true }
      )
      .setFooter({ text: `ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
