const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('claim your daily coins (every 20 hours)'),

  async execute(interaction) {
    const result = economy.claimDaily(interaction.user.id);

    if (!result.success) {
      const hours = Math.floor(result.remaining / 3600000);
      const mins = Math.floor((result.remaining % 3600000) / 60000);
      return interaction.reply({
        content: `you already claimed today, come back in **${hours}h ${mins}m**`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Daily claimed!')
      .setColor(0xf1c40f)
      .setDescription(`you got **${result.earned.toLocaleString()} coins**!`)
      .addFields(
        { name: '🔥 Streak', value: `${result.streak} day(s)`, inline: true },
        { name: '🎁 Streak Bonus', value: `+${result.bonus} coins`, inline: true },
        { name: '💰 New Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true }
      )
      .setFooter({ text: 'come back tomorrow to keep your streak going!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
