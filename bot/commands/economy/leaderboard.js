const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('see who has the most coins in the server'),

  async execute(interaction) {
    await interaction.deferReply();
    const top = economy.getLeaderboard(10);

    if (!top.length) {
      return interaction.editReply('nobody has any coins yet, use /daily to get started!');
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = await Promise.all(top.map(async (entry, i) => {
      let name = entry.id;
      try {
        const user = await interaction.client.users.fetch(entry.id);
        name = user.username;
      } catch {}
      const medal = medals[i] || `**${i + 1}.**`;
      return `${medal} ${name} - ${entry.balance.toLocaleString()} coins`;
    }));

    const embed = new EmbedBuilder()
      .setTitle('💰 Richest Members')
      .setDescription(lines.join('\n'))
      .setColor(0xf1c40f)
      .setFooter({ text: 'use /daily and /slots to earn more coins!' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }
};
