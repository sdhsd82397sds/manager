const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('check your coin balance')
    .addUserOption(o => o.setName('user').setDescription('check someone else\'s balance')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user = economy.getUser(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s wallet`)
      .setColor(0xf1c40f)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '💰 Balance', value: `${user.balance.toLocaleString()} coins`, inline: true },
        { name: '📈 Total Won', value: `${(user.totalWon || 0).toLocaleString()} coins`, inline: true },
        { name: '📉 Total Lost', value: `${(user.totalLost || 0).toLocaleString()} coins`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
