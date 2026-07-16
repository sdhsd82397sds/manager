const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const economy = require('../../modules/economy');

// active blackjack games: userId -> gameState
const games = new Map();

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) for (const val of VALUES) deck.push({ suit, val });
  return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.val)) return 10;
  if (card.val === 'A') return 11;
  return parseInt(card.val);
}

function handValue(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.val === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function formatHand(hand, hideSecond = false) {
  return hand.map((c, i) => (hideSecond && i === 1 ? '🂠' : `${c.val}${c.suit}`)).join(' ');
}

function buildButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('bj:hit').setLabel('Hit').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('bj:stand').setLabel('Stand').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
    new ButtonBuilder().setCustomId('bj:double').setLabel('Double Down').setStyle(ButtonStyle.Danger).setDisabled(disabled)
  );
}

function buildEmbed(game, result = null) {
  const playerVal = handValue(game.playerHand);
  const dealerVal = handValue(game.dealerHand);
  const showDealer = result !== null;

  let color = 0x5865f2;
  let title = '🃏 Blackjack';
  if (result === 'win') { color = 0x57f287; title = '🃏 Blackjack - You Won!'; }
  else if (result === 'lose') { color = 0xe74c3c; title = '🃏 Blackjack - You Lost'; }
  else if (result === 'push') { color = 0xf39c12; title = '🃏 Blackjack - Push (Tie)'; }
  else if (result === 'blackjack') { color = 0xf1c40f; title = '🃏 Blackjack - BLACKJACK!'; }
  else if (result === 'bust') { color = 0xe74c3c; title = '🃏 Blackjack - Bust!'; }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .addFields(
      {
        name: `Dealer's Hand ${showDealer ? `(${dealerVal})` : ''}`,
        value: formatHand(game.dealerHand, !showDealer)
      },
      {
        name: `Your Hand (${playerVal})`,
        value: formatHand(game.playerHand)
      },
      { name: 'Bet', value: `${game.bet.toLocaleString()} coins`, inline: true }
    )
    .setTimestamp();

  if (result !== null) {
    let net = 0;
    if (result === 'win') net = game.bet;
    else if (result === 'blackjack') net = Math.floor(game.bet * 1.5);
    else if (result === 'lose' || result === 'bust') net = -game.bet;
    const newBal = economy.getBalance(game.userId);
    embed.addFields({ name: 'Result', value: `${net >= 0 ? '+' : ''}${net.toLocaleString()} coins\nBalance: ${newBal.toLocaleString()} coins`, inline: true });
  }

  return embed;
}

async function finishGame(interaction, game, result) {
  let net = 0;
  if (result === 'win') net = game.bet;
  else if (result === 'blackjack') net = Math.floor(game.bet * 1.5);
  else if (result === 'lose' || result === 'bust') net = -game.bet;
  else if (result === 'push') net = 0;

  economy.addBalance(game.userId, net);
  games.delete(game.userId);

  const embed = buildEmbed(game, result);
  const disabledRow = buildButtons(true);

  await interaction.update({ embeds: [embed], components: [disabledRow] }).catch(() => {});
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('play a game of blackjack')
    .addIntegerOption(o =>
      o.setName('bet').setDescription('how many coins to bet').setRequired(true).setMinValue(10)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');

    if (games.has(interaction.user.id)) {
      return interaction.reply({ content: 'you already have a game going, finish that one first', ephemeral: true });
    }

    const balance = economy.getBalance(interaction.user.id);
    if (bet > balance) {
      return interaction.reply({ content: `you only have ${balance.toLocaleString()} coins`, ephemeral: true });
    }

    const deck = createDeck();
    const game = {
      userId: interaction.user.id,
      bet,
      deck,
      playerHand: [deck.pop(), deck.pop()],
      dealerHand: [deck.pop(), deck.pop()]
    };
    games.set(interaction.user.id, game);

    const playerVal = handValue(game.playerHand);

    // check for natural blackjack
    if (playerVal === 21) {
      const dealerVal = handValue(game.dealerHand);
      const result = dealerVal === 21 ? 'push' : 'blackjack';
      economy.addBalance(interaction.user.id, result === 'blackjack' ? Math.floor(bet * 1.5) : 0);
      games.delete(interaction.user.id);
      const embed = buildEmbed(game, result);
      return interaction.reply({ embeds: [embed], components: [buildButtons(true)] });
    }

    const embed = buildEmbed(game);
    await interaction.reply({ embeds: [embed], components: [buildButtons(false)] });
  },

  async handleButton(interaction, args) {
    const action = args[0];
    const game = games.get(interaction.user.id);

    if (!game) {
      return interaction.reply({ content: 'no active game found, start one with /blackjack', ephemeral: true });
    }

    if (interaction.user.id !== game.userId) {
      return interaction.reply({ content: 'that\'s not your game lol', ephemeral: true });
    }

    if (action === 'hit') {
      game.playerHand.push(game.deck.pop());
      const val = handValue(game.playerHand);
      if (val > 21) {
        await finishGame(interaction, game, 'bust');
      } else if (val === 21) {
        // auto-stand at 21
        while (handValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
        const dealerVal = handValue(game.dealerHand);
        const result = dealerVal > 21 || val > dealerVal ? 'win' : dealerVal === val ? 'push' : 'lose';
        await finishGame(interaction, game, result);
      } else {
        await interaction.update({ embeds: [buildEmbed(game)], components: [buildButtons(false)] });
      }
    }

    if (action === 'stand') {
      while (handValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
      const playerVal = handValue(game.playerHand);
      const dealerVal = handValue(game.dealerHand);
      let result;
      if (dealerVal > 21 || playerVal > dealerVal) result = 'win';
      else if (playerVal === dealerVal) result = 'push';
      else result = 'lose';
      await finishGame(interaction, game, result);
    }

    if (action === 'double') {
      const balance = economy.getBalance(game.userId);
      if (balance < game.bet) {
        return interaction.reply({ content: 'not enough coins to double down', ephemeral: true });
      }
      game.bet *= 2;
      game.playerHand.push(game.deck.pop());
      const playerVal = handValue(game.playerHand);
      if (playerVal > 21) {
        await finishGame(interaction, game, 'bust');
      } else {
        while (handValue(game.dealerHand) < 17) game.dealerHand.push(game.deck.pop());
        const dealerVal = handValue(game.dealerHand);
        let result;
        if (dealerVal > 21 || playerVal > dealerVal) result = 'win';
        else if (playerVal === dealerVal) result = 'push';
        else result = 'lose';
        await finishGame(interaction, game, result);
      }
    }
  }
};
