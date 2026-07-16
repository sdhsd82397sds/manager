const { SlashCommandBuilder } = require('discord.js');
const economy = require('../../modules/economy');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('give coins to another member')
    .addUserOption(o => o.setName('user').setDescription('who to give coins to').setRequired(true))
    .addIntegerOption(o => o.setName('amount').setDescription('how many coins').setRequired(true).setMinValue(1)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "you can't give coins to yourself lol", ephemeral: true });
    }
    if (target.bot) {
      return interaction.reply({ content: "bots don't need coins", ephemeral: true });
    }

    const balance = economy.getBalance(interaction.user.id);
    if (amount > balance) {
      return interaction.reply({ content: `you don't have that many coins (balance: ${balance.toLocaleString()})`, ephemeral: true });
    }

    economy.addBalance(interaction.user.id, -amount);
    economy.addBalance(target.id, amount);

    await interaction.reply(
      `sent **${amount.toLocaleString()} coins** to ${target} - your new balance is ${economy.getBalance(interaction.user.id).toLocaleString()} coins`
    );
  }
};
