const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnsPath = path.join(__dirname, '../../../data/warns.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('clear all warnings for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(o => o.setName('user').setDescription('whose warnings to clear').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    let warns = {};
    try { warns = JSON.parse(fs.readFileSync(warnsPath, 'utf8')); } catch {}

    const count = warns[target.id]?.length || 0;
    delete warns[target.id];
    fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));

    await interaction.reply({
      content: `cleared ${count} warning(s) for **${target.username}**, they're starting fresh`,
      ephemeral: false
    });
  }
};
