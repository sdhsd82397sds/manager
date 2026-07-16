const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const logging = require('./logging');

const configPath = path.join(__dirname, '../../data/config.json');

// pure JS tensorflow - no native compilation needed, works on any Node version
let nsfwModel = null;
let modelLoaded = false;
let modelLoading = false;

function getConfig() {
  try { return JSON.parse(fs.readFileSync(configPath, 'utf8')); }
  catch { return {}; }
}

async function loadModel() {
  if (modelLoaded || modelLoading) return;
  modelLoading = true;
  try {
    require('@tensorflow/tfjs-backend-cpu');
    const tf = require('@tensorflow/tfjs');
    await tf.setBackend('cpu');
    await tf.ready();
    const nsfwjs = require('nsfwjs');
    nsfwModel = await nsfwjs.load();
    modelLoaded = true;
    console.log('[NSFW Filter] AI model loaded and ready');
  } catch (err) {
    console.warn('[NSFW Filter] could not load AI model:', err.message);
    modelLoading = false;
  }
}

// kick off model load on startup only if enabled
if (getConfig().nsfwFilter?.enabled) {
  loadModel();
}

function isImageAttachment(attachment) {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const url = (attachment.url || '').toLowerCase().split('?')[0];
  return imageExts.some(ext => url.endsWith(ext)) || (attachment.contentType || '').startsWith('image/');
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const chunks = [];
    lib.get(url, res => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function isStaff(member, config) {
  const staffRoles = config.staffRoles || [];
  if (!staffRoles.length) return member.permissions.has(8n); // ADMINISTRATOR
  return member.roles.cache.some(r => staffRoles.includes(r.id));
}

async function check(message, client) {
  const config = getConfig();
  const filterConfig = config.nsfwFilter;
  if (!filterConfig?.enabled) return;
  if (isStaff(message.member, config)) return;

  const whitelisted = filterConfig.whitelistedChannels || [];
  if (whitelisted.includes(message.channel.id)) return;

  if (!modelLoaded) {
    if (!modelLoading) loadModel();
    return;
  }

  const threshold = filterConfig.threshold ?? 80;

  for (const [, attachment] of message.attachments) {
    if (!isImageAttachment(attachment)) continue;

    try {
      const imageBuffer = await downloadImage(attachment.url);

      // nsfwjs can classify from an image element - in Node we use a canvas approach
      // classify using buffer directly via nsfwjs
      const predictions = await nsfwModel.classify(imageBuffer);

      const scores = {};
      for (const p of predictions) {
        scores[p.className] = p.probability * 100;
      }

      const nsfwScore = (scores['Porn'] || 0) + (scores['Hentai'] || 0) + (scores['Sexy'] || 0);

      if (nsfwScore >= threshold) {
        await message.delete().catch(() => {});

        await message.author.send(
          `hey, your image in **${message.guild.name}** was removed - it got flagged as NSFW (${nsfwScore.toFixed(0)}% confidence). keep it clean in there!`
        ).catch(() => {});

        const warning = await message.channel.send({
          content: `${message.author} that image was removed for violating the rules`,
          allowedMentions: { users: [message.author.id] }
        }).catch(() => null);
        if (warning) setTimeout(() => warning.delete().catch(() => {}), 8000);

        await logging.logNsfwDetection(message, scores, client);

        console.log(`[NSFW Filter] removed image from ${message.author.tag} in #${message.channel.name} (${nsfwScore.toFixed(1)}%)`);
        break;
      }
    } catch (err) {
      console.error('[NSFW Filter] error scanning image:', err.message);
    }
  }
}

module.exports = { check, loadModel };
