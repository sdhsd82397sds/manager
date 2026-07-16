const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('get someone\'s avatar')
    .addUserOption(o => o.setName('user').setDescription('whose avatar (default: yours)')),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`${target.username}'s avatar`)
      .setImage(target.displayAvatarURL({ size: 4096 }))
      .setColor(0x5865f2)
      .addFields({ name: 'Links', value: `[png](${target.displayAvatarURL({ extension: 'png', size: 4096 })}) | [jpg](${target.displayAvatarURL({ extension: 'jpg', size: 4096 })}) | [webp](${target.displayAvatarURL({ extension: 'webp', size: 4096 })})` });

    await interaction.reply({ embeds: [embed] });
  }
};
