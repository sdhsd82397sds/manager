const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('shows all the bot commands you can use'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Commands')
      .setColor(0x5865f2)
      .setDescription('here is everything i can do! remember to use `/` before every command.')
      .addFields(
        { 
          name: '🛡️ Moderation', 
          value: '`/ban`, `/kick`, `/timeout`, `/warn`, `/warnings`, `/clearwarnings`, `/purge`, `/lock`, `/unlock`, `/slowmode`' 
        },
        { 
          name: '💰 Economy & Games', 
          value: '`/balance`, `/daily`, `/give`, `/leaderboard`, `/slots`, `/coinflip`, `/blackjack`, `/roulette`, `/rob`' 
        },
        { 
          name: '🛠️ Utility & Fun', 
          value: '`/ping`, `/userinfo`, `/serverinfo`, `/avatar`, `/poll`, `/8ball`' 
        }
      )
      .setFooter({ text: 'if you get any errors, make sure i have the right permissions!' });

    await interaction.reply({ embeds: [embed] });
  }
};
