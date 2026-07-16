const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const economy = require('../../modules/economy');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../../data/config.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('try to rob someone (risky!)')
    .addUserOption(o => o.setName('user').setDescription('who to rob').setRequired(true)),

  cooldown: 5,

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const config = getConfig();

    if (!target || target.user.bot) {
      return interaction.reply({ content: "can't rob that user", ephemeral: true });
    }
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: "you can't rob yourself lol", ephemeral: true });
    }

    // check rob cooldown
    const cooldownCheck = economy.canRob(interaction.user.id);
    if (!cooldownCheck.can) {
      const mins = Math.ceil(cooldownCheck.remaining / 60000);
      return interaction.reply({ content: `you just robbed someone, wait ${mins} more minute(s)`, ephemeral: true });
    }

    const robberBalance = economy.getBalance(interaction.user.id);
    const targetBalance = economy.getBalance(target.id);

    if (targetBalance < 100) {
      return interaction.reply({ content: `${target.user.username} is broke, not worth it lol`, ephemeral: true });
    }
    if (robberBalance < 50) {
      return interaction.reply({ content: "you need at least 50 coins to attempt a robbery", ephemeral: true });
    }

    const successChance = config.economy?.robSuccessChance ?? 35;
    const success = Math.random() * 100 < successChance;

    economy.setLastRob(interaction.user.id);

    const embed = new EmbedBuilder().setTimestamp();

    if (success) {
      const stolen = Math.floor(targetBalance * (0.1 + Math.random() * 0.2)); // steal 10-30%
      economy.addBalance(interaction.user.id, stolen);
      economy.addBalance(target.id, -stolen);

      embed.setTitle('robbery successful!')
        .setDescription(`you robbed **${stolen.toLocaleString()} coins** from ${target}!`)
        .setColor(0x57f287)
        .addFields({ name: '💰 Your Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true });
    } else {
      // caught! lose some coins as fine
      const fine = Math.floor(robberBalance * 0.15);
      economy.addBalance(interaction.user.id, -fine);
      economy.addBalance(target.id, Math.floor(fine * 0.5));

      embed.setTitle('caught red-handed!')
        .setDescription(`${target} caught you trying to rob them. you got fined **${fine.toLocaleString()} coins** and half went to them`)
        .setColor(0xe74c3c)
        .addFields({ name: '💰 Your Balance', value: `${economy.getBalance(interaction.user.id).toLocaleString()} coins`, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
