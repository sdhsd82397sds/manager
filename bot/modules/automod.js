const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../data/config.json');
const warnsPath = path.join(__dirname, '../../data/warns.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}

function getWarns() {
  try { return JSON.parse(fs.readFileSync(warnsPath, 'utf8')); }
  catch { return {}; }
}

function saveWarns(data) {
  fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2));
}

function addWarn(userId, reason) {
  const data = getWarns();
  if (!data[userId]) data[userId] = [];
  data[userId].push({ reason, timestamp: Date.now() });
  saveWarns(data);
  return data[userId].length;
}

// spam tracker: userId -> { count, timer }
const spamMap = new Map();

function isStaff(member, config) {
  const staffRoles = config.staffRoles || [];
  if (!staffRoles.length) return member.permissions.has(PermissionFlagsBits.ManageMessages);
  return member.roles.cache.some(r => staffRoles.includes(r.id));
}

async function check(message, client) {
  const config = getConfig();
  if (!config.automod?.enabled) return;
  if (isStaff(message.member, config)) return;

  const { automod } = config;

  // anti-spam
  if (automod.antiSpam?.enabled) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const record = spamMap.get(key) || { count: 0, firstMsg: now };

    if (now - record.firstMsg > (automod.antiSpam.interval || 3000)) {
      record.count = 1;
      record.firstMsg = now;
    } else {
      record.count++;
    }
    spamMap.set(key, record);

    if (record.count >= (automod.antiSpam.maxMessages || 5)) {
      await message.delete().catch(() => {});
      spamMap.set(key, { count: 0, firstMsg: now });
      await punish(message, client, config, 'slow down with the messages bro');
      return;
    }
  }

  // anti-link
  if (automod.antiLink?.enabled) {
    const linkRegex = /https?:\/\/[^\s]+|discord\.gg\/[^\s]+/gi;
    const whitelist = automod.antiLink.whitelist || [];
    if (linkRegex.test(message.content)) {
      const isWhitelisted = whitelist.some(w => message.content.includes(w));
      if (!isWhitelisted) {
        await message.delete().catch(() => {});
        await punish(message, client, config, 'links aren\'t allowed here');
        return;
      }
    }
  }

  // bad words filter
  if (automod.badWords?.enabled && automod.badWords.words?.length) {
    const lower = message.content.toLowerCase();
    const hit = automod.badWords.words.some(w => lower.includes(w.toLowerCase()));
    if (hit) {
      await message.delete().catch(() => {});
      await punish(message, client, config, 'watch the language please');
      return;
    }
  }

  // anti-caps
  if (automod.antiCaps?.enabled) {
    const { threshold = 70, minLength = 10 } = automod.antiCaps;
    if (message.content.length >= minLength) {
      const letters = message.content.replace(/[^a-zA-Z]/g, '');
      if (letters.length > 0) {
        const capsRatio = (letters.replace(/[^A-Z]/g, '').length / letters.length) * 100;
        if (capsRatio >= threshold) {
          await message.delete().catch(() => {});
          await message.channel.send({
            content: `${message.author} chill with the caps lol`,
            allowedMentions: { users: [message.author.id] }
          }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
          return;
        }
      }
    }
  }
}

async function punish(message, client, config, reason) {
  const warnCount = addWarn(message.author.id, `[AutoMod] ${reason}`);
  const escalation = config.automod?.escalation;

  // send a warning message in chat
  const warnMsg = await message.channel.send({
    content: `${message.author} heads up - ${reason}. (warn ${warnCount})`,
    allowedMentions: { users: [message.author.id] }
  }).catch(() => null);
  if (warnMsg) setTimeout(() => warnMsg.delete().catch(() => {}), 6000);

  if (!escalation?.enabled) return;

  const key = `warn${warnCount}`;
  const action = escalation[key];
  if (!action) return;

  const member = message.member;
  if (!member) return;

  try {
    if (action === 'timeout_10m') {
      await member.timeout(10 * 60 * 1000, `AutoMod: ${reason}`);
    } else if (action === 'timeout_1h') {
      await member.timeout(60 * 60 * 1000, `AutoMod: ${reason}`);
    } else if (action === 'kick') {
      await member.kick(`AutoMod escalation: ${reason}`);
    } else if (action === 'ban') {
      await member.ban({ reason: `AutoMod escalation: ${reason}`, deleteMessageSeconds: 86400 });
    }
  } catch (err) {
    console.error('[AutoMod] escalation failed:', err.message);
  }
}

// raid tracking
const joinLog = new Map();

async function checkRaid(member, client) {
  const config = getConfig();
  if (!config.automod?.antiRaid?.enabled) return;

  const { joinThreshold = 10, joinInterval = 10000 } = config.automod.antiRaid;
  const guildId = member.guild.id;
  const now = Date.now();

  if (!joinLog.has(guildId)) joinLog.set(guildId, []);
  const joins = joinLog.get(guildId).filter(t => now - t < joinInterval);
  joins.push(now);
  joinLog.set(guildId, joins);

  if (joins.length >= joinThreshold) {
    const settings = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/guildSettings.json'), 'utf8'));
    if (!settings.raidMode) {
      settings.raidMode = true;
      fs.writeFileSync(path.join(__dirname, '../../data/guildSettings.json'), JSON.stringify(settings, null, 2));

      const logCh = config.modLogChannel
        ? member.guild.channels.cache.get(config.modLogChannel)
        : null;

      if (logCh) {
        const embed = new EmbedBuilder()
          .setTitle('RAID DETECTED')
          .setDescription(`${joins.length} joins in ${joinInterval / 1000}s - raid mode activated`)
          .setColor(0xff0000)
          .setTimestamp();
        await logCh.send({ content: '@here', embeds: [embed] }).catch(() => {});
      }

      console.log('[AntiRaid] Raid mode activated!');
    }

    // kick the new member
    try {
      await member.kick('Anti-raid protection activated');
    } catch {}
  }
}

module.exports = { check, checkRaid, addWarn };
