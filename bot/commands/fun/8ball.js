const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const responses = [
  'yeah for sure', 'no way', 'probably', 'doubt it', 'ask again later',
  'signs point to yes', 'signs point to no', 'most likely', 'not a chance',
  'definitely', 'i wouldnt count on it', 'hard to say', 'looks good',
  'my sources say no', 'outlook not so great', '100% yes', 'absolutely not',
  'i mean maybe?', 'stop asking me this lol', 'yeah why not'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('ask the magic 8ball a question')
    .addStringOption(o => o.setName('question').setDescription('what do you wanna know').setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const response = responses[Math.floor(Math.random() * responses.length)];

    const embed = new EmbedBuilder()
      .setTitle('🎱 magic 8ball')
      .addFields(
        { name: 'you asked', value: question },
        { name: 'answer', value: response }
      )
      .setColor(0x2c2f33)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
