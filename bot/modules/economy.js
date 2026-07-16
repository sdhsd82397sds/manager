const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const configPath = path.join(__dirname, '../../data/config.json');

function loadEconomy() {
  try {
    return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveEconomy(data) {
  fs.writeFileSync(economyPath, JSON.stringify(data, null, 2));
}

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function ensureUser(userId) {
  const data = loadEconomy();
  const config = getConfig();
  const startBal = config.economy?.startingBalance ?? 500;
  if (!data[userId]) {
    data[userId] = {
      balance: startBal,
      bank: 0,
      lastDaily: null,
      dailyStreak: 0,
      lastRob: null,
      totalWon: 0,
      totalLost: 0
    };
    saveEconomy(data);
  }
  return data[userId];
}

function getBalance(userId) {
  const data = loadEconomy();
  return data[userId]?.balance ?? 0;
}

function addBalance(userId, amount) {
  ensureUser(userId);
  const data = loadEconomy();
  data[userId].balance = Math.max(0, (data[userId].balance || 0) + amount);
  if (amount > 0) data[userId].totalWon = (data[userId].totalWon || 0) + amount;
  else data[userId].totalLost = (data[userId].totalLost || 0) + Math.abs(amount);
  saveEconomy(data);
  return data[userId].balance;
}

function setBalance(userId, amount) {
  ensureUser(userId);
  const data = loadEconomy();
  data[userId].balance = Math.max(0, amount);
  saveEconomy(data);
  return data[userId].balance;
}

function getUser(userId) {
  ensureUser(userId);
  const data = loadEconomy();
  return data[userId];
}

function claimDaily(userId) {
  ensureUser(userId);
  const config = getConfig();
  const dailyReward = config.economy?.dailyReward ?? 200;
  const streakBonus = config.economy?.dailyStreakBonus ?? 50;
  const data = loadEconomy();
  const user = data[userId];
  const now = Date.now();
  const cooldown = 20 * 60 * 60 * 1000; // 20 hours

  if (user.lastDaily && now - user.lastDaily < cooldown) {
    const remaining = cooldown - (now - user.lastDaily);
    return { success: false, remaining };
  }

  // check streak (within 48h of last claim)
  const withinStreak = user.lastDaily && (now - user.lastDaily < 48 * 60 * 60 * 1000);
  user.dailyStreak = withinStreak ? (user.dailyStreak || 0) + 1 : 1;
  user.lastDaily = now;

  const bonus = Math.min(user.dailyStreak - 1, 10) * streakBonus;
  const earned = dailyReward + bonus;
  user.balance = (user.balance || 0) + earned;
  saveEconomy(data);

  return { success: true, earned, streak: user.dailyStreak, bonus };
}

function getLeaderboard(limit = 10) {
  const data = loadEconomy();
  return Object.entries(data)
    .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
    .slice(0, limit)
    .map(([id, d]) => ({ id, balance: d.balance || 0 }));
}

function canRob(userId) {
  const data = loadEconomy();
  const config = getConfig();
  const cooldown = config.economy?.robCooldown ?? 1800000;
  const user = data[userId];
  if (!user || !user.lastRob) return { can: true };
  const diff = Date.now() - user.lastRob;
  if (diff < cooldown) return { can: false, remaining: cooldown - diff };
  return { can: true };
}

function setLastRob(userId) {
  ensureUser(userId);
  const data = loadEconomy();
  data[userId].lastRob = Date.now();
  saveEconomy(data);
}

module.exports = {
  ensureUser,
  getBalance,
  addBalance,
  setBalance,
  getUser,
  claimDaily,
  getLeaderboard,
  canRob,
  setLastRob,
  loadEconomy,
  saveEconomy
};
