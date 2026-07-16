const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');
const modlogsPath = path.join(__dirname, '../../data/modlogs.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}

function getModlogs() {
  try { return JSON.parse(fs.readFileSync(modlogsPath, 'utf8')); }
  catch { return { cases: [], nextCase: 1 }; }
}

function saveModlogs(data) {
  fs.writeFileSync(modlogsPath, JSON.stringify(data, null, 2));
}

function addCase(action, moderator, target, reason) {
  const data = getModlogs();
  const caseId = data.nextCase++;
  data.cases.push({
    id: caseId,
    action,
    moderatorId: moderator.id,
    moderatorTag: moderator.tag || moderator.username,
    targetId: target.id,
    targetTag: target.tag || target.username,
    reason: reason || 'no reason given',
    timestamp: Date.now()
  });
  saveModlogs(data);
  return caseId;
}

async function getLogChannel(guild, config) {
  const chId = config.logChannel;
  if (!chId) return null;
  return guild.channels.cache.get(chId) || null;
}

async function getModLogChannel(guild, config) {
  const chId = config.modLogChannel;
  if (!chId) return null;
  return guild.channels.cache.get(chId) || null;
}

async function logModerationAction(guild, client, { action, moderator, target, reason, duration }) {
  const config = getConfig();
  if (!config.logging?.modActions) return;

  const caseId = addCase(action, moderator, target, reason);
  const ch = await getModLogChannel(guild, config);
  if (!ch) return;

  const colors = {
    BAN: 0xe74c3c,
    KICK: 0xe67e22,
    TIMEOUT: 0xf39c12,
    WARN: 0xf1c40f,
    UNBAN: 0x2ecc71,
    UNTIMEOUT: 0x27ae60
  };

  const embed = new EmbedBuilder()
    .setTitle(`Case #${caseId} - ${action}`)
    .setColor(colors[action] || 0x5865f2)
    .addFields(
      { name: 'User', value: `${target.tag || target.username} (${target.id})`, inline: true },
      { name: 'Moderator', value: `${moderator.tag || moderator.username}`, inline: true },
      { name: 'Reason', value: reason || 'no reason given' }
    )
    .setTimestamp();

  if (duration) embed.addFields({ name: 'Duration', value: duration, inline: true });

  await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logMessageDelete(message, client) {
  const config = getConfig();
  if (!config.logging?.messageDelete) return;
  const ch = await getLogChannel(message.guild, config);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setTitle('Message Deleted')
    .setColor(0xe74c3c)
    .setAuthor({ name: message.author?.tag || 'Unknown', iconURL: message.author?.displayAvatarURL() })
    .addFields(
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Content', value: message.content?.slice(0, 1024) || '*[no text content]*' }
    )
    .setTimestamp();

  await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logMessageEdit(oldMsg, newMsg, client) {
  const config = getConfig();
  if (!config.logging?.messageEdit) return;
  const ch = await getLogChannel(newMsg.guild, config);
  if (!ch) return;

  const embed = new EmbedBuilder()
    .setTitle('Message Edited')
    .setColor(0xf39c12)
    .setAuthor({ name: newMsg.author?.tag || 'Unknown', iconURL: newMsg.author?.displayAvatarURL() })
    .addFields(
      { name: 'Channel', value: `${newMsg.channel}`, inline: true },
      { name: 'Before', value: oldMsg.content?.slice(0, 512) || '*empty*' },
      { name: 'After', value: newMsg.content?.slice(0, 512) || '*empty*' }
    )
    .setURL(newMsg.url)
    .setTimestamp();

  await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logMemberJoin(member, client) {
  const config = getConfig();
  if (!config.logging?.memberJoin) return;
  const ch = await getLogChannel(member.guild, config);
  if (!ch) return;

  const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / 86400000);

  const embed = new EmbedBuilder()
    .setTitle('Member Joined')
    .setColor(0x2ecc71)
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .addFields(
      { name: 'User', value: `${member.user} (${member.user.id})`, inline: true },
      { name: 'Account Age', value: `${accountAge} days`, inline: true },
      { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  if (accountAge < 7) {
    embed.addFields({ name: 'NEW ACCOUNT', value: 'account is less than 7 days old, keep an eye on this one' });
    embed.setColor(0xf39c12);
  }

  await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logMemberLeave(member, client) {
  const config = getConfig();
  if (!config.logging?.memberLeave) return;
  const ch = await getLogChannel(member.guild, config);
  if (!ch) return;

  const roles = member.roles.cache
    .filter(r => r.id !== member.guild.id)
    .map(r => r.name)
    .join(', ') || 'none';

  const embed = new EmbedBuilder()
    .setTitle('Member Left')
    .setColor(0xe74c3c)
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .addFields(
      { name: 'User', value: `${member.user} (${member.user.id})`, inline: true },
      { name: 'Roles', value: roles.slice(0, 512) }
    )
    .setTimestamp();

  await ch.send({ embeds: [embed] }).catch(() => {});
}

async function logNsfwDetection(message, scores, client) {
  const config = getConfig();
  const ch = await getModLogChannel(message.guild, config);
  if (!ch) return;

  const topScore = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0];

  const embed = new EmbedBuilder()
    .setTitle('NSFW Image Detected & Deleted')
    .setColor(0xff0055)
    .addFields(
      { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
      { name: 'Channel', value: `${message.channel}`, inline: true },
      { name: 'Detection', value: `${topScore[0]}: ${topScore[1].toFixed(1)}% confidence` }
    )
    .setTimestamp();

  await ch.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  addCase,
  logModerationAction,
  logMessageDelete,
  logMessageEdit,
  logMemberJoin,
  logMemberLeave,
  logNsfwDetection
};
