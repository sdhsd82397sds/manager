const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('create a poll')
    .addStringOption(o => o.setName('question').setDescription('what to ask').setRequired(true))
    .addStringOption(o => o.setName('option1').setDescription('first option').setRequired(true))
    .addStringOption(o => o.setName('option2').setDescription('second option').setRequired(true))
    .addStringOption(o => o.setName('option3').setDescription('third option'))
    .addStringOption(o => o.setName('option4').setDescription('fourth option')),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const options = [
      interaction.options.getString('option1'),
      interaction.options.getString('option2'),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
    ].filter(Boolean);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
    const optionsText = options.map((o, i) => `${emojis[i]} ${o}`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${question}`)
      .setDescription(optionsText)
      .setColor(0x5865f2)
      .setFooter({ text: `poll by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < options.length; i++) {
      await msg.react(emojis[i]);
    }
  }
};
