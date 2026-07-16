const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnsPath = path.join(__dirname, '../../../data/warns.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('check a member\'s warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('whose warnings to check').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    let warns = {};
    try { warns = JSON.parse(fs.readFileSync(warnsPath, 'utf8')); } catch {}

    const userWarns = warns[target.id] || [];

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${target.username}`)
      .setColor(0xf1c40f)
      .setThumbnail(target.displayAvatarURL());

    if (userWarns.length === 0) {
      embed.setDescription('this user has no warnings, they\'re clean!');
    } else {
      embed.setDescription(`total: **${userWarns.length} warning(s)**`);
      userWarns.slice(-10).forEach((w, i) => {
        const date = new Date(w.timestamp).toLocaleDateString();
        embed.addFields({ name: `#${userWarns.length - 9 + i} - ${date}`, value: w.reason });
      });
      if (userWarns.length > 10) embed.setFooter({ text: `showing last 10 of ${userWarns.length} warnings` });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
