// state
let config = {};
let warnsData = {};
let currentModPage = 1;

// nav routing
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    navigateTo(page);
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const navEl = document.getElementById(`nav-${page}`);
  const pageEl = document.getElementById(`page-${page}`);
  if (navEl) navEl.classList.add('active');
  if (pageEl) pageEl.classList.add('active');
  document.getElementById('page-title').textContent = navEl?.textContent.trim() || page;

  // lazy load data per page
  if (page === 'home') loadHome();
  if (page === 'modlogs') loadModlogs(1);
  if (page === 'warnings') loadWarnings();
}

// show save toast
function showToast(msg = '✓ saved!') {
  const toast = document.getElementById('save-toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// fetch helpers
async function api(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api${path}`, opts);
  return res.json();
}

// ========================
// INIT
// ========================
async function init() {
  config = await api('/config');
  populateSettings();
  populateAutoMod();
  populateLogging();
  populateWelcome();
  populateNsfw();
  populateEconomy();
  loadHome();
}

// ========================
// HOME
// ========================
async function loadHome() {
  const stats = await api('/stats');
  document.getElementById('stat-warns').textContent = stats.totalWarns ?? '-';
  document.getElementById('stat-cases').textContent = stats.totalCases ?? '-';
  document.getElementById('stat-users').textContent = stats.totalUsers ?? '-';

  const lb = await api('/economy/leaderboard');
  const ranks = ['🥇', '🥈', '🥉'];
  const list = document.getElementById('lb-list');

  if (!lb.length) {
    list.innerHTML = '<div class="loading">nobody has coins yet</div>';
    return;
  }

  list.innerHTML = lb.slice(0, 10).map((u, i) => `
    <div class="lb-item">
      <div class="lb-rank">${ranks[i] || `${i + 1}`}</div>
      <div class="lb-name">${u.id}</div>
      <div class="lb-coins">🪙 ${u.balance.toLocaleString()}</div>
    </div>
  `).join('');
}

// ========================
// SETTINGS
// ========================
function populateSettings() {
  setVal('cfg-prefix', config.prefix);
  setVal('cfg-logChannel', config.logChannel || '');
  setVal('cfg-modLogChannel', config.modLogChannel || '');
  setVal('cfg-autoRoleId', config.autoRoleId || '');
  setVal('cfg-staffRoles', (config.staffRoles || []).join(', '));
}

async function saveSettings() {
  const staffRoles = getVal('cfg-staffRoles')
    .split(',').map(s => s.trim()).filter(Boolean);

  await api('/config', 'POST', {
    prefix: getVal('cfg-prefix') || '!',
    logChannel: getVal('cfg-logChannel') || null,
    modLogChannel: getVal('cfg-modLogChannel') || null,
    autoRoleId: getVal('cfg-autoRoleId') || null,
    staffRoles
  });
  showToast();
}

// ========================
// AUTO-MOD
// ========================
function populateAutoMod() {
  const am = config.automod || {};
  setCheck('am-enabled', am.enabled);
  setCheck('am-spam-enabled', am.antiSpam?.enabled);
  setVal('am-spam-max', am.antiSpam?.maxMessages ?? 5);
  setVal('am-spam-interval', am.antiSpam?.interval ?? 3000);
  setCheck('am-link-enabled', am.antiLink?.enabled);
  setVal('am-link-whitelist', (am.antiLink?.whitelist || []).join(', '));
  setCheck('am-bw-enabled', am.badWords?.enabled);
  setVal('am-bw-words', (am.badWords?.words || []).join(', '));
  setCheck('am-caps-enabled', am.antiCaps?.enabled);
  setVal('am-caps-threshold', am.antiCaps?.threshold ?? 70);
  setVal('am-caps-minlen', am.antiCaps?.minLength ?? 10);
  setCheck('am-esc-enabled', am.escalation?.enabled);
  setSelectVal('am-esc-warn3', am.escalation?.warn3 ?? 'timeout_10m');
  setSelectVal('am-esc-warn4', am.escalation?.warn4 ?? 'timeout_1h');
  setSelectVal('am-esc-warn5', am.escalation?.warn5 ?? 'kick');
  setSelectVal('am-esc-warn6', am.escalation?.warn6 ?? 'ban');
}

async function saveAutoMod() {
  const linkWhitelist = getVal('am-link-whitelist').split(',').map(s => s.trim()).filter(Boolean);
  const badWords = getVal('am-bw-words').split(',').map(s => s.trim()).filter(Boolean);

  await api('/config', 'POST', {
    automod: {
      enabled: getCheck('am-enabled'),
      antiSpam: {
        enabled: getCheck('am-spam-enabled'),
        maxMessages: parseInt(getVal('am-spam-max')) || 5,
        interval: parseInt(getVal('am-spam-interval')) || 3000
      },
      antiLink: { enabled: getCheck('am-link-enabled'), whitelist: linkWhitelist },
      badWords: { enabled: getCheck('am-bw-enabled'), words: badWords },
      antiCaps: {
        enabled: getCheck('am-caps-enabled'),
        threshold: parseInt(getVal('am-caps-threshold')) || 70,
        minLength: parseInt(getVal('am-caps-minlen')) || 10
      },
      escalation: {
        enabled: getCheck('am-esc-enabled'),
        warn3: getSelectVal('am-esc-warn3'),
        warn4: getSelectVal('am-esc-warn4'),
        warn5: getSelectVal('am-esc-warn5'),
        warn6: getSelectVal('am-esc-warn6')
      }
    }
  });
  showToast();
}

// ========================
// LOGGING
// ========================
function populateLogging() {
  const l = config.logging || {};
  setCheck('log-delete', l.messageDelete);
  setCheck('log-edit', l.messageEdit);
  setCheck('log-join', l.memberJoin);
  setCheck('log-leave', l.memberLeave);
  setCheck('log-modactions', l.modActions);
  setCheck('log-voice', l.voiceActivity);
}

async function saveLogging() {
  await api('/config', 'POST', {
    logging: {
      messageDelete: getCheck('log-delete'),
      messageEdit: getCheck('log-edit'),
      memberJoin: getCheck('log-join'),
      memberLeave: getCheck('log-leave'),
      modActions: getCheck('log-modactions'),
      voiceActivity: getCheck('log-voice')
    }
  });
  showToast();
}

// ========================
// WELCOME
// ========================
function populateWelcome() {
  setVal('wlc-channel', config.welcomeChannel || '');
  setVal('wlc-message', config.welcomeMessage || '');
  setVal('wlc-leave', config.leaveMessage || '');
}

async function saveWelcome() {
  await api('/config', 'POST', {
    welcomeChannel: getVal('wlc-channel') || null,
    welcomeMessage: getVal('wlc-message'),
    leaveMessage: getVal('wlc-leave')
  });
  showToast();
}

// ========================
// NSFW FILTER
// ========================
function populateNsfw() {
  const n = config.nsfwFilter || {};
  setCheck('nsfw-enabled', n.enabled);
  setVal('nsfw-threshold', n.threshold ?? 80);
  setVal('nsfw-whitelist', (n.whitelistedChannels || []).join(', '));
}

async function saveNsfw() {
  const whitelist = getVal('nsfw-whitelist').split(',').map(s => s.trim()).filter(Boolean);
  await api('/config', 'POST', {
    nsfwFilter: {
      enabled: getCheck('nsfw-enabled'),
      threshold: parseInt(getVal('nsfw-threshold')) || 80,
      whitelistedChannels: whitelist
    }
  });
  showToast();
}

// ========================
// ECONOMY
// ========================
function populateEconomy() {
  const e = config.economy || {};
  setVal('eco-start', e.startingBalance ?? 500);
  setVal('eco-daily', e.dailyReward ?? 200);
  setVal('eco-streak', e.dailyStreakBonus ?? 50);
  setVal('eco-maxbet', e.maxBet ?? 10000);
  setVal('eco-rob', e.robSuccessChance ?? 35);
  setVal('eco-robcd', Math.round((e.robCooldown ?? 1800000) / 60000));
}

async function saveEconomy() {
  await api('/config', 'POST', {
    economy: {
      startingBalance: parseInt(getVal('eco-start')) || 500,
      dailyReward: parseInt(getVal('eco-daily')) || 200,
      dailyStreakBonus: parseInt(getVal('eco-streak')) || 50,
      maxBet: parseInt(getVal('eco-maxbet')) || 10000,
      robSuccessChance: parseInt(getVal('eco-rob')) || 35,
      robCooldown: (parseInt(getVal('eco-robcd')) || 30) * 60000
    }
  });
  showToast();
}

async function setUserBalance() {
  const userId = getVal('eco-uid').trim();
  const balance = parseInt(getVal('eco-newbal'));
  if (!userId || isNaN(balance)) {
    alert('fill in both the user ID and balance');
    return;
  }
  const res = await api('/economy/set', 'POST', { userId, balance });
  if (res.success) showToast('balance updated!');
  else alert('something went wrong: ' + (res.error || 'unknown'));
}

// ========================
// MOD LOGS
// ========================
async function loadModlogs(page = 1) {
  currentModPage = page;
  const data = await api(`/modlogs?page=${page}`);
  const tbody = document.getElementById('modlogs-body');

  if (!data.cases || data.cases.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty">no mod cases yet</td></tr>';
    document.getElementById('modlogs-pagination').innerHTML = '';
    return;
  }

  const actionBadge = (action) => {
    const map = { BAN: 'ban', KICK: 'kick', TIMEOUT: 'timeout', WARN: 'warn' };
    const cls = map[action] || 'default';
    return `<span class="badge badge-${cls}">${action}</span>`;
  };

  tbody.innerHTML = data.cases.map(c => `
    <tr>
      <td><strong>#${c.id}</strong></td>
      <td>${actionBadge(c.action)}</td>
      <td title="${c.targetId}">${c.targetTag || c.targetId}</td>
      <td title="${c.moderatorId}">${c.moderatorTag || c.moderatorId}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.reason}">${c.reason}</td>
      <td style="white-space:nowrap;color:rgba(255,255,255,0.4);font-size:12px;">${new Date(c.timestamp).toLocaleDateString()}</td>
    </tr>
  `).join('');

  // pagination
  const pag = document.getElementById('modlogs-pagination');
  if (data.pages <= 1) { pag.innerHTML = ''; return; }
  pag.innerHTML = Array.from({ length: data.pages }, (_, i) => i + 1)
    .map(p => `<button class="${p === page ? 'active' : ''}" onclick="loadModlogs(${p})">${p}</button>`)
    .join('');
}

// ========================
// WARNINGS
// ========================
async function loadWarnings() {
  warnsData = await api('/warns');
  renderWarnings(warnsData);
}

function renderWarnings(data) {
  const list = document.getElementById('warns-list');
  const entries = Object.entries(data);

  if (!entries.length) {
    list.innerHTML = '<div class="loading">no warnings on record, everyone\'s behaving i guess</div>';
    return;
  }

  list.innerHTML = entries.map(([uid, warns]) => `
    <div class="warn-user-card" id="wcard-${uid}">
      <div class="warn-user-header" onclick="toggleWarnCard('${uid}')">
        <div>
          <div class="warn-user-id">User ID: ${uid}</div>
          <div class="warn-count">${warns.length} warning(s)</div>
        </div>
        <button class="btn-danger" onclick="event.stopPropagation(); clearUserWarns('${uid}')">Clear All</button>
      </div>
      <div class="warn-entries" id="wentries-${uid}">
        ${warns.map((w, i) => `
          <div class="warn-entry">
            <span class="warn-entry-num">#${i + 1}</span>
            <span class="warn-entry-reason">${w.reason}</span>
            <span class="warn-entry-date">${new Date(w.timestamp).toLocaleDateString()}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function toggleWarnCard(uid) {
  const entries = document.getElementById(`wentries-${uid}`);
  entries.classList.toggle('open');
}

async function clearUserWarns(uid) {
  if (!confirm(`clear all warnings for ${uid}? this can't be undone`)) return;
  const res = await api(`/warns/${uid}`, 'DELETE');
  if (res.success) {
    delete warnsData[uid];
    renderWarnings(warnsData);
    showToast(`cleared ${res.cleared} warning(s)`);
  }
}

function filterWarns() {
  const q = document.getElementById('warn-search').value.trim().toLowerCase();
  if (!q) { renderWarnings(warnsData); return; }
  const filtered = Object.fromEntries(
    Object.entries(warnsData).filter(([uid]) => uid.includes(q))
  );
  renderWarnings(filtered);
}

// ========================
// UTILS
// ========================
function getVal(id) { return document.getElementById(id)?.value ?? ''; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val ?? ''; }
function getCheck(id) { return document.getElementById(id)?.checked ?? false; }
function setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; }
function getSelectVal(id) { return document.getElementById(id)?.value ?? ''; }
function setSelectVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

// kick things off
init();
