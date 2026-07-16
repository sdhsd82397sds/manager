const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const dataDir = path.join(__dirname, '../../data');
const configPath = path.join(dataDir, 'config.json');
const warnsPath = path.join(dataDir, 'warns.json');
const modlogsPath = path.join(dataDir, 'modlogs.json');
const economyPath = path.join(dataDir, 'economy.json');

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}
function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

// GET /api/config
router.get('/config', (req, res) => {
  const config = readJSON(configPath);
  // never expose token to frontend
  res.json(config);
});

// POST /api/config
router.post('/config', (req, res) => {
  try {
    const config = readJSON(configPath);
    const updates = req.body;
    // deep merge
    const merged = deepMerge(config, updates);
    writeJSON(configPath, merged);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

// GET /api/stats
router.get('/stats', (req, res) => {
  const economy = readJSON(economyPath);
  const warns = readJSON(warnsPath);
  const modlogs = readJSON(modlogsPath);

  const totalUsers = Object.keys(economy).length;
  const totalWarns = Object.values(warns).reduce((a, w) => a + w.length, 0);
  const totalCases = (modlogs.cases || []).length;

  res.json({ totalUsers, totalWarns, totalCases });
});

// GET /api/warns
router.get('/warns', (req, res) => {
  const warns = readJSON(warnsPath);
  res.json(warns);
});

// DELETE /api/warns/:userId
router.delete('/warns/:userId', (req, res) => {
  const warns = readJSON(warnsPath);
  const count = warns[req.params.userId]?.length || 0;
  delete warns[req.params.userId];
  writeJSON(warnsPath, warns);
  res.json({ success: true, cleared: count });
});

// GET /api/modlogs
router.get('/modlogs', (req, res) => {
  const data = readJSON(modlogsPath);
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const cases = (data.cases || []).reverse();
  const total = cases.length;
  const items = cases.slice((page - 1) * limit, page * limit);
  res.json({ cases: items, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/economy/leaderboard
router.get('/economy/leaderboard', (req, res) => {
  const data = readJSON(economyPath);
  const top = Object.entries(data)
    .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
    .slice(0, 20)
    .map(([id, d]) => ({ id, balance: d.balance || 0, dailyStreak: d.dailyStreak || 0 }));
  res.json(top);
});

// POST /api/economy/set
router.post('/economy/set', (req, res) => {
  const { userId, balance } = req.body;
  if (!userId || balance === undefined) return res.status(400).json({ error: 'missing fields' });
  const data = readJSON(economyPath);
  if (!data[userId]) data[userId] = { balance: 0, totalWon: 0, totalLost: 0, dailyStreak: 0 };
  data[userId].balance = Math.max(0, parseInt(balance));
  writeJSON(economyPath, data);
  res.json({ success: true });
});

// GET /api/nsfwfilter
router.get('/nsfwfilter', (req, res) => {
  const config = readJSON(configPath);
  res.json(config.nsfwFilter || {});
});

module.exports = router;
