const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');

const SLOTS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '🍀', '⭐'];
const PAYOUTS = {
  '💎💎💎': 50,
  '7️⃣7️⃣7️⃣': 20,
  '🍀🍀🍀': 15,
  '⭐⭐⭐': 10,
  '🔔🔔🔔': 8,
  '🍋🍋🍋': 5,
  '🍒🍒🍒': 3,
};

function spin() {
  return [0, 1, 2].map(() => SLOTS[Math.floor(Math.random() * SLOTS.length)]);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('spin the slot machine')
    .addIntegerOption(o =>
      o.setName('bet').setDescription('how many coins to bet').setRequired(true).setMinValue(10)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const balance = economy.getBalance(interaction.user.id);

    if (bet > balance) {
      return interaction.reply({ content: `you don't have enough coins, your balance is ${balance.toLocaleString()}`, ephemeral: true });
    }

    const reels = spin();
    const key = reels.join('');
    const multiplier = PAYOUTS[key] || 0;

    let resultText, color, net;

    if (multiplier > 0) {
      net = bet * (multiplier - 1);
      economy.addBalance(interaction.user.id, net);
      resultText = `you won **${(bet * multiplier).toLocaleString()} coins**! (${multiplier}x)`;
      color = 0x57f287;
    } else {
      // check for two of a kind
      const twoOfKind = reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2];
      if (twoOfKind) {
        net = -Math.floor(bet * 0.5);
        economy.addBalance(interaction.user.id, net);
        resultText = `two of a kind! you only lose half your bet (-${Math.floor(bet * 0.5).toLocaleString()} coins)`;
        color = 0xf39c12;
      } else {
        net = -bet;
        economy.addBalance(interaction.user.id, -bet);
        resultText = `you lost **${bet.toLocaleString()} coins** :(`;
        color = 0xe74c3c;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🎰 Slots')
      .setDescription(`**[ ${reels.join(' | ')} ]**\n\n${resultText}`)
      .setColor(color)
      .addFields({ name: '💰 Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true })
      .setFooter({ text: multiplier > 0 ? 'nice one!' : 'better luck next time' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
