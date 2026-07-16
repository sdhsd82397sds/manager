const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('flip a coin and bet on it')
    .addStringOption(o =>
      o.setName('side').setDescription('heads or tails?').setRequired(true)
        .addChoices({ name: 'heads', value: 'heads' }, { name: 'tails', value: 'tails' })
    )
    .addIntegerOption(o =>
      o.setName('bet').setDescription('how many coins to bet').setRequired(true).setMinValue(10)
    ),

  async execute(interaction) {
    const choice = interaction.options.getString('side');
    const bet = interaction.options.getInteger('bet');
    const balance = economy.getBalance(interaction.user.id);

    if (bet > balance) {
      return interaction.reply({ content: `you only have ${balance.toLocaleString()} coins, you can't bet that much`, ephemeral: true });
    }

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = result === choice;

    economy.addBalance(interaction.user.id, won ? bet : -bet);

    const embed = new EmbedBuilder()
      .setTitle(won ? '🪙 You won!' : '🪙 You lost!')
      .setDescription(`the coin landed on **${result}**\nyou picked **${choice}**`)
      .setColor(won ? 0x57f287 : 0xe74c3c)
      .addFields(
        { name: won ? 'Winnings' : 'Loss', value: `${won ? '+' : '-'}${bet.toLocaleString()} coins`, inline: true },
        { name: '💰 New Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
