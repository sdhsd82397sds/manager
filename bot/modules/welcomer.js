const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}

function formatMessage(template, member) {
  return template
    .replace(/{user}/g, `<@${member.id}>`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{membercount}/g, member.guild.memberCount);
}

async function handleJoin(member, client) {
  const config = getConfig();
  if (!config.welcomeChannel) return;

  const channel = member.guild.channels.cache.get(config.welcomeChannel);
  if (!channel) return;

  const msg = config.welcomeMessage || 'hey {user}, welcome to {server}!';

  const embed = new EmbedBuilder()
    .setTitle(`welcome to ${member.guild.name}!`)
    .setDescription(formatMessage(msg, member))
    .setColor(0x5865f2)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .addFields({ name: 'member count', value: `you are member #${member.guild.memberCount}!`, inline: true })
    .setFooter({ text: 'glad to have you here' })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});

  // auto-role
  if (config.autoRoleId) {
    const role = member.guild.roles.cache.get(config.autoRoleId);
    if (role) await member.roles.add(role).catch(() => {});
  }
}

async function handleLeave(member, client) {
  const config = getConfig();
  if (!config.welcomeChannel) return;

  const channel = member.guild.channels.cache.get(config.welcomeChannel);
  if (!channel) return;

  const msg = config.leaveMessage || 'welp, {username} just left. rip';

  const embed = new EmbedBuilder()
    .setDescription(formatMessage(msg, member))
    .setColor(0x747f8d)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { handleJoin, handleLeave };
