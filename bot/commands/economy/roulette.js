const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

const BETS = [
  { name: 'red', value: 'red', payout: 2 },
  { name: 'black', value: 'black', payout: 2 },
  { name: 'green (0)', value: 'green', payout: 35 },
];

const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACKS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function spin() {
  return Math.floor(Math.random() * 37); // 0-36
}

function getColor(num) {
  if (num === 0) return 'green';
  if (REDS.includes(num)) return 'red';
  return 'black';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('play roulette')
    .addStringOption(o =>
      o.setName('bet_on').setDescription('what to bet on').setRequired(true)
        .addChoices(
          { name: 'Red (2x)', value: 'red' },
          { name: 'Black (2x)', value: 'black' },
          { name: 'Green / 0 (35x)', value: 'green' },
          { name: 'Odd (2x)', value: 'odd' },
          { name: 'Even (2x)', value: 'even' }
        )
    )
    .addIntegerOption(o =>
      o.setName('bet').setDescription('how many coins to bet').setRequired(true).setMinValue(10)
    ),

  async execute(interaction) {
    const betOn = interaction.options.getString('bet_on');
    const bet = interaction.options.getInteger('bet');
    const balance = economy.getBalance(interaction.user.id);

    if (bet > balance) {
      return interaction.reply({ content: `you only have ${balance.toLocaleString()} coins`, ephemeral: true });
    }

    const result = spin();
    const resultColor = getColor(result);
    const resultOddEven = result === 0 ? 'neither' : result % 2 === 0 ? 'even' : 'odd';

    let won = false;
    let multiplier = 0;

    if (betOn === 'red' && resultColor === 'red') { won = true; multiplier = 2; }
    else if (betOn === 'black' && resultColor === 'black') { won = true; multiplier = 2; }
    else if (betOn === 'green' && resultColor === 'green') { won = true; multiplier = 35; }
    else if (betOn === 'odd' && resultOddEven === 'odd') { won = true; multiplier = 2; }
    else if (betOn === 'even' && resultOddEven === 'even') { won = true; multiplier = 2; }

    const colorEmoji = { red: '🔴', black: '⚫', green: '🟢' };
    const net = won ? bet * (multiplier - 1) : -bet;
    economy.addBalance(interaction.user.id, net);

    const embed = new EmbedBuilder()
      .setTitle('🎡 Roulette')
      .setDescription(`the ball landed on **${colorEmoji[resultColor]} ${result}** (${resultOddEven})`)
      .setColor(won ? 0x57f287 : 0xe74c3c)
      .addFields(
        { name: 'You Bet On', value: betOn, inline: true },
        { name: won ? 'Winnings' : 'Loss', value: `${net >= 0 ? '+' : ''}${net.toLocaleString()} coins`, inline: true },
        { name: '💰 Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true }
      )
      .setFooter({ text: won ? `nice, ${multiplier}x payout!` : 'spin again?' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
