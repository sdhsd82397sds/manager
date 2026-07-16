const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('check if the bot is alive and see latency'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: 'pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setTitle('still alive!')
      .setColor(0x57f287)
      .addFields(
        { name: 'Roundtrip', value: `${roundtrip}ms`, inline: true },
        { name: 'API Latency', value: `${Math.round(client.ws.ping)}ms`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  }
};
