'use strict';
/* ==========================================================================
   HEROS PLAYER — pure remote. No local files. Full detection + full control
   of YouTube Music, YouTube, Spotify, SoundCloud & any media tab.
   Sections: 1 helpers 2 prefs 3 injected probe/act 4 exec/target 5 poll+hero
   6 radar 7 transport 8 tools 9 features 10 menu 11 keyboard 12 boot
   ========================================================================== */

/* ---------- 1. Helpers ---------- */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtT = (s) => { if (!isFinite(s) || s < 0) s = 0; s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function toast(msg, ms = 2600) {
  const box = $('toasts'); const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg; box.appendChild(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, ms);
}
function setStatus(s) { $('status').textContent = s; }
function hostOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return ''; } }
const SITE_LABEL = {
  'music.youtube.com': 'YouTube Music', 'youtube.com': 'YouTube',
  'open.spotify.com': 'Spotify', 'soundcloud.com': 'SoundCloud',
  'music.apple.com': 'Apple Music', 'deezer.com': 'Deezer', 'tidal.com': 'Tidal',
};
function siteLabel(host) { return SITE_LABEL[host] || SITE_LABEL['www.' + host] || host || 'Web player'; }
const MUSIC_HOSTS = ['music.youtube.com', 'youtube.com', 'open.spotify.com', 'soundcloud.com', 'music.apple.com', 'deezer.com', 'tidal.com', 'bandcamp.com', 'pandora.com', 'audiomack.com', 'mixcloud.com'];
function isMusicUrl(url) {
  const h = hostOf(url);
  return MUSIC_HOSTS.some((m) => h === m || h.endsWith('.' + m));
}

/* ---------- 2. Prefs ---------- */
const DEF = { theme: 'dark', accent: '#4c8dff', follow: true, pinnedId: null, pollMs: 1000, duck: false, cmds: 0, seen: 0, favs: {}, notes: {}, hist: [], secs: 0, day: '', todaySecs: 0, goalMin: 60, single: false, siteVols: {}, notif: false, stopAfter: false, volMem: false };
let P = { ...DEF };
const store = {
  async get(k, fb) { try { const r = await chrome.storage.local.get(k); return r[k] ?? fb; } catch (_) { try { const v = localStorage.getItem('hp_' + k); return v ? JSON.parse(v) : fb; } catch (_) { return fb; } } },
  async set(o) { try { await chrome.storage.local.set(o); } catch (_) {} try { for (const k of Object.keys(o)) localStorage.setItem('hp_' + k, JSON.stringify(o[k])); } catch (_) {} },
};
const savePrefs = debounce(() => store.set({ prefs: P }), 400);
function chromeOK() { try { return !!(chrome && chrome.tabs && chrome.tabs.query); } catch (_) { return false; } }

/* ---------- 3. Injected probe + act (self-contained: no outer refs) ---------- */
function herosProbe() {
  var out = { hasMedia: false, playing: false, title: '', artist: '', album: '', artwork: '', duration: 0, currentTime: 0, volume: 1, muted: false, rate: 1, hasNext: false, hasPrev: false, shuffle: null, repeat: null, like: null, dislike: null, site: location.hostname };
  try {
    var els = Array.prototype.slice.call(document.querySelectorAll('audio,video'));
    var m = null;
    for (var i = 0; i < els.length; i++) { if (els[i].duration > 0) { m = els[i]; break; } }
    if (!m) m = els[0] || null;
    if (m) {
      out.hasMedia = true;
      out.playing = !m.paused && !m.ended;
      if (isFinite(m.duration)) out.duration = m.duration;
      out.currentTime = m.currentTime || 0;
      out.volume = (typeof m.volume === 'number') ? m.volume : 1;
      out.muted = !!m.muted;
      out.rate = m.playbackRate || 1;
    }
    var md = null;
    try { md = (navigator.mediaSession && navigator.mediaSession.metadata) || null; } catch (e0) {}
    if (md) {
      out.title = md.title || ''; out.artist = md.artist || ''; out.album = md.album || '';
      try { if (md.artwork && md.artwork.length) out.artwork = md.artwork[md.artwork.length - 1].src || ''; } catch (e1) {}
    }
    try {
      var tEl = document.querySelector('.title.style-scope.ytmusic-player-bar');
      if (tEl && tEl.textContent.trim()) out.title = tEl.textContent.trim();
      var sEl = document.querySelector('.subtitle.style-scope.ytmusic-player-bar');
      if (sEl && sEl.textContent.trim()) {
        var parts = sEl.textContent.trim().split(/\s*[•·]\s*/);
        if (!out.artist && parts[0]) out.artist = parts[0];
        if (!out.album && parts[1]) out.album = parts[1];
      }
      var img = document.querySelector('.image.style-scope.ytmusic-player-bar');
      if (img && img.src && img.src.indexOf('data:') !== 0) out.artwork = img.src;
    } catch (e2) {}
    if (!out.title) {
      var dt = (document.title || '').replace(/\s*-\s*YouTube Music\s*$/i, '').replace(/\s*-\s*YouTube\s*$/i, '').trim();
      if (dt && !/^(home|search|library|explore)$/i.test(dt)) {
        var mm = dt.match(/^(.+?)\s*[-–—]\s*(.+)$/);
        if (mm) { if (!out.artist) out.artist = mm[1].trim(); out.title = mm[2].trim(); }
        else out.title = dt;
      }
    }
    try {
      var btns = Array.prototype.slice.call(document.querySelectorAll('button, [role="button"]'));
      var lab = function (b) { var a = b.getAttribute ? (b.getAttribute('aria-label') || b.getAttribute('title') || '') : ''; return (a || b.title || '').trim(); };
      var find = function (re) { for (var k = 0; k < btns.length; k++) { if (re.test(lab(btns[k]))) return btns[k]; } return null; };
      out.hasNext = !!find(/^next/i); out.hasPrev = !!find(/^prev/i);
      var bSh = find(/^shuffle/i);
      if (bSh) out.shuffle = (bSh.getAttribute('aria-pressed') === 'true') ? 'on' : 'off';
      var bRp = find(/^repeat/i);
      if (bRp) {
        var l = lab(bRp).toLowerCase();
        if (/off/.test(l)) out.repeat = 'off';
        else if (/one/.test(l)) out.repeat = 'one';
        else if (bRp.getAttribute('aria-pressed') === 'true') out.repeat = 'one';
        else out.repeat = 'all';
      }
      var bLike = find(/thumbs?\s*up|^like$/i);
      if (bLike) out.like = (bLike.getAttribute('aria-pressed') === 'true') ? 'on' : 'off';
      var bDis = find(/thumbs?\s*down|^dislike$/i);
      if (bDis) out.dislike = (bDis.getAttribute('aria-pressed') === 'true') ? 'on' : 'off';
    } catch (e3) {}
  } catch (e4) {}
  return out;
}

function herosAct(action, value) {
  function media() {
    var els = Array.prototype.slice.call(document.querySelectorAll('audio,video'));
    for (var i = 0; i < els.length; i++) { if (els[i].duration > 0) return els[i]; }
    return els[0] || null;
  }
  function clickBtn(re) {
    var btns = Array.prototype.slice.call(document.querySelectorAll('button, [role="button"]'));
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var l = ((b.getAttribute && (b.getAttribute('aria-label') || b.getAttribute('title'))) || '').trim();
      if (re.test(l)) { b.click(); return true; }
    }
    return false;
  }
  try {
    var m = media();
    if (action === 'toggle') {
      if (clickBtn(/^(pause|play)(\s|$)/i)) return true;
      if (m) { if (m.paused) { try { m.play(); } catch (e) {} } else { m.pause(); } return true; }
      return false;
    }
    if (action === 'pause') { if (m && !m.paused) m.pause(); return true; }
    if (action === 'next') return clickBtn(/^next/i);
    if (action === 'prev') return clickBtn(/^prev/i);
    if (action === 'seek' && m && isFinite(m.duration)) { m.currentTime = Math.max(0, Math.min(m.duration - 0.25, value)); return true; }
    if (action === 'volume' && m) { m.volume = Math.max(0, Math.min(1, value)); m.muted = false; return true; }
    if (action === 'rate' && m) { try { m.playbackRate = value; } catch (e) {} return true; }
    if (action === 'shuffle') return clickBtn(/^shuffle/i);
    if (action === 'repeat') return clickBtn(/^repeat/i);
    if (action === 'like') return clickBtn(/thumbs?\s*up|^like$/i);
    if (action === 'dislike') return clickBtn(/thumbs?\s*down|^dislike$/i);
  } catch (e) { return false; }
  return false;
}

/* ---------- 4. Exec + target ---------- */
async function exec(tabId, func, args) {
  try {
    const r = await chrome.scripting.executeScript({ target: { tabId }, func, args: args || [] });
    return r && r[0] ? r[0].result : null;
  } catch (_) { return null; }
}
let controlledId = null;
let lastProbe = null;
let lastKey = '';
let lastSite = '';
let seenKeys = new Set();
let soundingTabs = [];
let musicTabs = [];

async function tabAlive(id) {
  try { await chrome.tabs.get(id); return true; } catch (_) { return false; }
}
async function resolveTarget() {
  if (!chromeOK()) return null;
  if (P.pinnedId && await tabAlive(P.pinnedId)) { controlledId = P.pinnedId; return controlledId; }
  P.pinnedId = null;
  if (P.follow) {
    try {
      const aud = await chrome.tabs.query({ audible: true });
      soundingTabs = aud;
      if (aud.length) { controlledId = aud[0].id; return controlledId; }
    } catch (_) {}
  }
  if (controlledId && await tabAlive(controlledId)) return controlledId;
  // fall back: any music site tab
  try {
    const all = await chrome.tabs.query({});
    const mus = all.find((t) => isMusicUrl(t.url || ''));
    if (mus) { controlledId = mus.id; return controlledId; }
  } catch (_) {}
  controlledId = null;
  return null;
}
async function act(action, value) {
  const id = await resolveTarget();
  if (id == null) { toast('No media tab — launch YouTube Music first'); return false; }
  const ok = await exec(id, herosAct, [action, value === undefined ? 0 : value]);
  P.cmds++; savePrefs(); $('stCmds').textContent = P.cmds;
  if (ok === false && (action === 'next' || action === 'prev' || action === 'like' || action === 'dislike' || action === 'shuffle' || action === 'repeat')) {
    toast('This site has no such button');
  }
  setTimeout(pollOnce, 350);
  return ok !== false;
}

/* ---------- 5. Poll + hero ---------- */
let seeking = false, volDrag = false;
async function pollOnce() {
  const id = await resolveTarget();
  if (id == null) { renderIdle(); return; }
  const st = await exec(id, herosProbe);
  if (!st) { renderIdle(); return; }
  lastProbe = st;
  // times (don't fight the user's drag)
  if (!seeking && st.duration > 0) {
    $('seek').value = Math.floor((st.currentTime / st.duration) * 1000);
    $('tCur').textContent = fmtT(st.currentTime);
    $('tDur').textContent = fmtT(st.duration);
  }
  if (!volDrag) $('vol').value = Math.round((st.muted ? 0 : st.volume) * 100);
  // listening time (only while actually playing)
  if (st.playing) {
    rollDay();
    P.secs++; P.todaySecs++;
    if (P.secs % 5 === 0) savePrefs();
    updateGoal();
  }
  // track change?
  const key = (st.title || '') + '::' + (st.artist || '');
  if (key !== lastKey) {
    const had = !!lastKey;
    lastKey = key;
    if (st.title && !seenKeys.has(key)) { seenKeys.add(key); P.seen = seenKeys.size; $('stTracks').textContent = P.seen; }
    if (st.title) {
      P.hist.unshift({ at: Date.now(), title: st.title, artist: st.artist || '', site: siteLabel(st.site) });
      P.hist = P.hist.slice(0, 100);
    }
    if (st.site && st.site !== lastSite) {
      lastSite = st.site;
      if (P.volMem && P.siteVols[st.site] != null && st.duration > 0) act('volume', P.siteVols[st.site]);
    }
    savePrefs();
    renderHero(st);
    syncSongCard();
    renderSongs();
    if (st.title) notifyTrack(st);
    if (P.stopAfter && had && st.title) {
      P.stopAfter = false; $('stopSw').checked = false; savePrefs();
      act('pause'); toast('Stopped after that song');
    }
  }
  renderTransport(st);
}
function notifyTrack(st) {
  if (!P.notif || !st.title) return;
  try {
    chrome.notifications.create({ type: 'basic', iconUrl: 'icons/icon128.png', title: st.title.slice(0, 80), message: ([st.artist, siteLabel(st.site)].filter(Boolean).join(' · ') || 'Now playing').slice(0, 120), priority: 0, silent: true });
  } catch (_) {}
}
function renderHero(st) {
  const has = !!(st.title || st.hasMedia);
  $('npTitle').textContent = st.title || (st.hasMedia ? 'Playing media' : 'Nothing detected');
  $('npArtist').textContent = [st.artist, st.album].filter(Boolean).join(' · ') || (has ? siteLabel(st.site) : 'Open YouTube Music and press play');
  const cv = $('cover');
  if (st.artwork) cv.innerHTML = '<img src="' + esc(st.artwork) + '" alt="cover" onerror="this.remove()">';
  else { cv.innerHTML = '<span id="coverLetter">' + esc(((st.title || 'H')[0] || 'H').toUpperCase()) + '</span>'; }
  $('chipSrc').textContent = siteLabel(st.site);
  const cs = $('chipState');
  if (has) { cs.hidden = false; cs.textContent = st.playing ? 'Playing' : 'Paused'; }
  else cs.hidden = true;
  document.title = (st.playing ? '▶ ' : '') + (st.title || 'Heros Player') + ' — Heros Player';
  renderTarget();
}
function renderIdle() {
  lastProbe = null; lastKey = '';
  $('npTitle').textContent = 'Nothing detected';
  $('npArtist').textContent = 'Open YouTube Music and press play';
  $('cover').innerHTML = '<span id="coverLetter">H</span>';
  $('chipSrc').textContent = 'No source';
  $('chipState').hidden = true;
  $('playIcon').innerHTML = '<path d="M8 5v14l11-7z"/>';
  document.title = 'Heros Player';
  renderTarget();
}
function renderTransport(st) {
  $('playIcon').innerHTML = st.playing ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
  $('btnNext').disabled = !st.hasNext && !st.hasMedia;
  $('btnPrev').disabled = !st.hasPrev && !st.hasMedia;
  $('btnShuffle').classList.toggle('on', st.shuffle === 'on');
  $('btnShuffle').style.opacity = st.shuffle == null ? 0.4 : 1;
  const rp = $('btnRepeat');
  rp.classList.toggle('on', st.repeat === 'all' || st.repeat === 'one');
  rp.style.opacity = st.repeat == null ? 0.4 : 1;
  rp.title = 'Repeat: ' + (st.repeat || 'n/a') + ' (click to cycle)';
  $('btnLike').classList.toggle('on', st.like === 'on');
  $('btnLike').style.opacity = st.like == null ? 0.4 : 1;
  $('btnDislike').classList.toggle('on', st.dislike === 'on');
  $('btnDislike').style.opacity = st.dislike == null ? 0.4 : 1;
  $('btnMute').classList.toggle('on', !!st.muted);
}
async function renderTarget() {
  const box = $('targetCard');
  if (controlledId == null) { box.innerHTML = '<div class="chip">No target — launch a music site below</div>'; return; }
  try {
    const t = await chrome.tabs.get(controlledId);
    const h = hostOf(t.url || '');
    box.innerHTML = '<div class="row active">' +
      (t.favIconUrl ? '<img class="fav" style="background:none" src="' + esc(t.favIconUrl) + '" onerror="this.remove()">' : '<div class="fav">♪</div>') +
      '<div class="grow"><div class="t">' + esc(siteLabel(h)) + '</div><div class="d">' + esc((t.title || '').slice(0, 80)) + '</div></div>' +
      (P.pinnedId === controlledId ? '<span class="chip">Pinned</span>' : '') +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:6px">' +
      '<button class="btn ghost" data-t2="pin" style="flex:1;height:32px;font-size:12px">' + (t.pinned ? 'Unpin tab' : 'Pin tab') + '</button>' +
      '<button class="btn ghost" data-t2="reload" style="flex:1;height:32px;font-size:12px">Reload</button>' +
      '<button class="btn ghost" data-t2="mutesite" style="flex:1;height:32px;font-size:12px">Mute site</button>' +
      '</div>';
    $('statMini').textContent = siteLabel(h);
  } catch (_) { box.innerHTML = ''; }
}

/* ---------- 6. Radar: sounding + standby ---------- */
async function refreshRadar() {
  if (!chromeOK()) {
    $('soundList').innerHTML = '<div class="empty"><b>Tab control needs extension context</b><br>Load Heros Player unpacked.</div>';
    return;
  }
  let aud = [], all = [];
  try { aud = await chrome.tabs.query({ audible: true }); } catch (_) {}
  try { all = await chrome.tabs.query({}); } catch (_) {}
  soundingTabs = aud;
  musicTabs = all.filter((t) => isMusicUrl(t.url || ''));
  const n = aud.length;
  $('chipTabs').hidden = n === 0;
  $('chipTabsN').textContent = n + (n === 1 ? ' sounding' : ' sounding');
  $('stTabs').textContent = n;
  $('stSites').textContent = musicTabs.length;
  // probe sounding tabs for live play state (cheap, capped)
  const states = {};
  for (const t of aud.slice(0, 8)) {
    const st = await exec(t.id, herosProbe);
    states[t.id] = st && st.playing ? 'playing' : (st ? 'paused' : 'sounding');
  }
  const rowHtml = (t, sub, dotCls, showPlay) => {
    const h = hostOf(t.url || '');
    return '<div class="row' + (t.id === controlledId ? ' active' : '') + '" data-tab="' + t.id + '">' +
      '<span class="tabdot ' + dotCls + '"></span>' +
      (t.favIconUrl ? '<img class="fav" style="background:none" src="' + esc(t.favIconUrl) + '" onerror="this.remove()">' : '<div class="fav">♪</div>') +
      '<div class="grow"><div class="t">' + esc((t.title || 'Untitled').slice(0, 70)) + '</div><div class="d">' + esc(h) + ' · ' + sub + '</div></div>' +
      (showPlay ? '<button class="ibtn" data-tact="toggle" title="Play/Pause" style="width:32px;height:32px"><svg class="ic ic-sm" viewBox="0 0 24 24"><path d="' + (sub === 'playing' ? 'M7 5h4v14H7zM13 5h4v14h-4z' : 'M8 5v14l11-7z') + '"/></svg></button>' : '') +
      '<button class="ibtn" data-tact="control" title="Control this tab" style="width:32px;height:32px"><svg class="ic ic-sm" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></button>' +
      '<button class="ibtn" data-tact="mute" title="Mute/Unmute" style="width:32px;height:32px"><svg class="ic ic-sm" viewBox="0 0 24 24"><path d="M4 10v4h4l5 5V5L8 10z"/><path d="' + (t.mutedInfo && t.mutedInfo.muted ? 'M16 9l6 6M22 9l-6 6' : 'M16 9a4 4 0 0 1 0 6') + '"/></svg></button>' +
      '<button class="ibtn" data-tact="goto" title="Go to tab" style="width:32px;height:32px"><svg class="ic ic-sm" viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></button>' +
      '</div>';
  };
  $('soundList').innerHTML = aud.length
    ? aud.map((t) => rowHtml(t, states[t.id] || 'sounding', (t.mutedInfo && t.mutedInfo.muted) ? 'muted' : '', true)).join('')
    : '<div class="chip">Quiet — nothing is sounding</div>';
  const standbyBase = musicTabs.filter((t) => !aud.some((a) => a.id === t.id));
  for (const t of deepTabs) {
    if (!aud.some((a) => a.id === t.id) && !standbyBase.some((s) => s.id === t.id)) standbyBase.push(t);
  }
  const standby = standbyBase;
  $('standbyList').innerHTML = standby.length
    ? standby.map((t) => rowHtml(t, 'standing by', 'idle', false)).join('')
    : '<div class="chip">No music sites open — launch one from Control</div>';
  $('tabEmpty').hidden = (aud.length + musicTabs.length) > 0;
}
async function tabRowAction(id, tact) {
  try {
    if (tact === 'goto') {
      await chrome.tabs.update(id, { active: true });
      const t = await chrome.tabs.get(id);
      await chrome.windows.update(t.windowId, { focused: true });
    } else if (tact === 'mute') {
      const t = await chrome.tabs.get(id);
      await chrome.tabs.update(id, { muted: !(t.mutedInfo && t.mutedInfo.muted) });
      setTimeout(refreshRadar, 400);
    } else if (tact === 'toggle') {
      await exec(id, herosAct, ['toggle', 0]);
      P.cmds++; setTimeout(() => { refreshRadar(); pollOnce(); }, 500);
    } else if (tact === 'control') {
      P.pinnedId = id; controlledId = id; P.follow = false; $('followSw').checked = false;
      savePrefs(); pollOnce(); refreshRadar();
      toast('Controlling this tab (pinned)');
    }
  } catch (_) { toast('Tab blocked this action'); }
}
$('soundList').addEventListener('click', (e) => {
  const b = e.target.closest('button'); const row = e.target.closest('.row'); if (!row) return;
  tabRowAction(+row.dataset.tab, b ? b.dataset.tact : 'goto');
});
$('standbyList').addEventListener('click', (e) => {
  const b = e.target.closest('button'); const row = e.target.closest('.row'); if (!row) return;
  tabRowAction(+row.dataset.tab, b ? b.dataset.tact : 'control');
});
$('btnTabsRefresh').onclick = () => { refreshRadar(); pollOnce(); };
$('btnPauseAll').onclick = async () => {
  try {
    const all = await chrome.tabs.query({});
    for (const t of all.slice(0, 30)) { try { await exec(t.id, herosAct, ['pause', 0]); } catch (_) {} }
  } catch (_) {}
  // deterministic: pause every audible tab via media pause
  for (const t of soundingTabs) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: t.id }, func: function () { document.querySelectorAll('audio,video').forEach(function (x) { x.pause(); }); } });
    } catch (_) {}
  }
  toast('Paused everything'); setTimeout(() => { refreshRadar(); pollOnce(); }, 500);
};
$('btnMuteAll').onclick = async () => {
  try { const all = await chrome.tabs.query({}); for (const t of all) { try { await chrome.tabs.update(t.id, { muted: true }); } catch (_) {} } toast('Muted all tabs'); setTimeout(refreshRadar, 400); } catch (_) {}
};
$('btnUnmuteAll').onclick = async () => {
  try { const all = await chrome.tabs.query({}); for (const t of all) { try { await chrome.tabs.update(t.id, { muted: false }); } catch (_) {} } setTimeout(refreshRadar, 400); } catch (_) {}
};

/* ---------- 6b. Songs: star, notes, history, deep scan, single-source ---------- */
function setProgress(p) { const el = $('progress'); if (el) el.style.width = (p * 100).toFixed(0) + '%'; if (p >= 1) setTimeout(() => { el.style.width = '0'; }, 400); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function rollDay() { const d = todayStr(); if (P.day !== d) { P.day = d; P.todaySecs = 0; } }
function updateGoal() {
  const m = Math.floor(P.todaySecs / 60);
  $('goalInfo').textContent = m + 'm of ' + P.goalMin + 'm goal';
  $('goalBar').style.width = Math.min(100, Math.round((m / P.goalMin) * 100)) + '%';
}
function songKey() { return lastProbe && lastProbe.title ? (lastProbe.title + '::' + (lastProbe.artist || '')) : ''; }
function syncSongCard() {}
function toggleStar() {
  const k = songKey();
  if (!k || !lastProbe) { toast('No song detected yet'); return; }
  if (P.favs[k]) { delete P.favs[k]; toast('Unstarred'); }
  else { P.favs[k] = { title: lastProbe.title, artist: lastProbe.artist || '', site: siteLabel(lastProbe.site), at: Date.now() }; toast('Starred — kept forever'); }
  savePrefs(); syncSongCard(); renderSongs();
}
function copySong() {
  const k = songKey();
  if (!k || !lastProbe) { toast('No song detected yet'); return; }
  const s = lastProbe.title + (lastProbe.artist ? ' — ' + lastProbe.artist : '');
  try { navigator.clipboard.writeText(s).then(() => toast('Copied: ' + s.slice(0, 60))); }
  catch (_) { toast(s); }
}
function findSong(q) {
  const query = q || (lastProbe && lastProbe.title ? (lastProbe.title + ' ' + (lastProbe.artist || '')) : '');
  if (!query.trim()) { toast('No song to find'); return; }
  chrome.tabs.create({ url: 'https://music.youtube.com/search?q=' + encodeURIComponent(query) });
  toast('Searching: ' + query.slice(0, 50));
}
$('targetCard').addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-t2]'); if (!b) return;
  const id = await resolveTarget(); if (id == null) return;
  const k = b.dataset.t2;
  try {
    if (k === 'pin') { const t = await chrome.tabs.get(id); await chrome.tabs.update(id, { pinned: !t.pinned }); renderTarget(); toast(t.pinned ? 'Tab unpinned' : 'Tab pinned'); }
    if (k === 'reload') { await chrome.tabs.reload(id); toast('Player reloaded'); setTimeout(pollOnce, 1500); }
    if (k === 'mutesite') {
      const t = await chrome.tabs.get(id); const h = hostOf(t.url || '');
      const all = await chrome.tabs.query({});
      let n = 0;
      for (const x of all) { if (hostOf(x.url || '') === h && !(x.mutedInfo && x.mutedInfo.muted)) { try { await chrome.tabs.update(x.id, { muted: true }); n++; } catch (_) {} } }
      toast(n ? 'Muted ' + n + ' ' + h + ' tab(s)' : h + ' already muted');
      refreshRadar(); pollOnce();
    }
  } catch (_) { toast('Tab blocked this action'); }
});
$('pane-control').addEventListener('click', (e) => {
  const n = e.target.closest('button[data-nudge]');
  if (n && lastProbe && lastProbe.duration) { act('seek', Math.max(0, Math.min(lastProbe.duration - 0.5, lastProbe.currentTime + (+n.dataset.nudge)))); return; }
  const r = e.target.closest('button[data-rate]');
  if (r) { act('rate', +r.dataset.rate); $('rgRate').value = (+r.dataset.rate) * 100; $('rateVal').textContent = r.dataset.rate + 'x'; return; }
  const v = e.target.closest('button[data-vol]');
  if (v) { $('vol').value = v.dataset.vol; $('vol').onchange({ target: $('vol') }); }
});
$('cover').style.cursor = 'pointer';
$('cover').onclick = async () => { const id = await resolveTarget(); if (id != null) tabRowAction(id, 'goto'); };
function renderSongs() {
  updateGoal();
  const q = (($('songSearch') && $('songSearch').value) || '').toLowerCase().trim();
  const match = (t, a) => !q || ((t || '') + ' ' + (a || '')).toLowerCase().includes(q);
  const favs = Object.entries(P.favs).map(([k, v]) => ({ k, ...v })).filter((f) => match(f.title, f.artist)).sort((a, b) => b.at - a.at).slice(0, 50);
  const counts = {};
  for (const h of P.hist) {
    const k = h.title + '::' + (h.artist || '');
    if (!counts[k]) counts[k] = { n: 0, title: h.title, artist: h.artist || '' };
    counts[k].n++;
  }
  const top = Object.values(counts).sort((a, b) => b.n - a.n).slice(0, 5);
  $('topList').innerHTML = top.length ? top.map((t, i) =>
    '<div class="row"><span class="chip">#' + (i + 1) + '</span><div class="grow"><div class="t">' + esc(t.title) + '</div><div class="d">' + esc(t.artist) + ' · ' + t.n + 'x</div></div>' +
    '<button class="ibtn" data-topfind="' + esc(t.title + ' ' + t.artist) + '" title="Find it" style="width:30px;height:30px"><svg class="ic ic-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></button></div>'
  ).join('') : '<div class="chip">Play something first</div>';
  $('favList').innerHTML = favs.length ? favs.map((f) =>
    '<div class="row"><div class="fav">★</div><div class="grow"><div class="t">' + esc(f.title) + '</div><div class="d">' + esc([f.artist, f.site].filter(Boolean).join(' · ')) + (P.notes[f.k] ? '<br>✎ ' + esc(P.notes[f.k].slice(0, 80)) : '') + '</div></div>' +
    '<button class="ibtn" data-fact="find" data-k="' + esc(f.k) + '" title="Find it" style="width:30px;height:30px"><svg class="ic ic-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></button>' +
    '<button class="ibtn" data-fact="unstar" data-k="' + esc(f.k) + '" title="Unstar" style="width:30px;height:30px"><svg class="ic ic-sm" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>'
  ).join('') : '<div class="chip">Star any song — it lives here forever</div>';
  $('histList').innerHTML = P.hist.filter((h) => match(h.title, h.artist)).slice(0, 50).map((h) =>
    '<div class="row"><div class="grow"><div class="t">' + esc(h.title) + '</div><div class="d">' + new Date(h.at).toLocaleTimeString() + ' · ' + esc([h.artist, h.site].filter(Boolean).join(' · ')) + '</div></div>' +
    '<button class="ibtn" data-hfind="' + esc(h.title + ' ' + (h.artist || '')) + '" title="Find it" style="width:30px;height:30px"><svg class="ic ic-sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></button></div>'
  ).join('') || '<div class="chip">Every detected song lands here</div>';
}
$('songSearch').oninput = debounce(renderSongs, 200);
$('topList').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-topfind]'); if (!b) return;
  findSong(b.dataset.topfind);
});
$('btnSongsTxt').onclick = () => {
  const lines = P.hist.map((h) => new Date(h.at).toLocaleString() + ' — ' + h.title + (h.artist ? ' — ' + h.artist : '') + ' [' + h.site + ']');
  dl(new Blob([lines.join('\n') || 'No history yet'], { type: 'text/plain' }), 'heros-player-history.txt');
  toast('History exported as TXT');
};
$('favList').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const k = b.dataset.k;
  if (b.dataset.fact === 'unstar') { delete P.favs[k]; savePrefs(); syncSongCard(); renderSongs(); }
  if (b.dataset.fact === 'find' && P.favs[k]) findSong(P.favs[k].title + ' ' + (P.favs[k].artist || ''));
});
$('histList').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-hfind]'); if (!b) return;
  findSong(b.dataset.hfind);
});
$('btnSongsExport').onclick = () => {
  dl(new Blob([JSON.stringify({ app: 'heros-player-songs', v: 1, favs: P.favs, hist: P.hist, notes: P.notes }, null, 1)], { type: 'application/json' }), 'heros-player-songs.json');
  toast('Songs exported');
};
/* Deep scan: probe every tab for hidden media */
let deepTabs = [];
$('btnDeep').onclick = async () => {
  if (!chromeOK()) return;
  toast('Deep scanning tabs…');
  let all = [];
  try { all = await chrome.tabs.query({}); } catch (_) { return; }
  deepTabs = [];
  const cands = all.slice(0, 60);
  for (let i = 0; i < cands.length; i++) {
    setProgress((i + 1) / cands.length);
    const st = await exec(cands[i].id, herosProbe);
    if (st && (st.hasMedia || st.title)) deepTabs.push(cands[i]);
  }
  setProgress(1);
  refreshRadar();
  toast('Deep scan: ' + deepTabs.length + ' media tab(s)');
};
$('btnDups').onclick = async () => {
  let all = []; try { all = await chrome.tabs.query({}); } catch (_) { return; }
  const seen = new Set(); const dups = [];
  for (const t of all) {
    const u = t.url || '';
    if (!u || u.indexOf('chrome') === 0 || u.indexOf('about:') === 0) continue;
    if (seen.has(u)) { if (t.audible || isMusicUrl(u)) dups.push(t); }
    else seen.add(u);
  }
  if (!dups.length) { toast('No duplicate music tabs'); return; }
  for (const t of dups) { try { await chrome.tabs.remove(t.id); } catch (_) {} }
  toast('Closed ' + dups.length + ' duplicate(s)');
  refreshRadar(); pollOnce();
};
/* Close every other music/sounding tab */
$('btnCloseOthers').onclick = async () => {
  const id = await resolveTarget(); if (id == null) return;
  let all = [];
  try { all = await chrome.tabs.query({}); } catch (_) { return; }
  const others = all.filter((t) => t.id !== id && (t.audible || isMusicUrl(t.url || '')));
  if (!others.length) { toast('No other music tabs'); return; }
  modal('<h3>Close ' + others.length + ' tab(s)?</h3><p style="color:var(--muted);font-size:13px">Keeps only the tab you control.</p><div style="display:flex;gap:8px"><button class="btn accent" id="coYes" style="flex:1">Close ' + others.length + '</button><button class="btn ghost" id="coNo" style="flex:1">Keep</button></div>');
  $('coNo').onclick = closeModal;
  $('coYes').onclick = async () => {
    for (const t of others) { try { await chrome.tabs.remove(t.id); } catch (_) {} }
    closeModal(); setTimeout(() => { refreshRadar(); pollOnce(); }, 500);
    toast('Closed ' + others.length + ' tab(s)');
  };
};
/* Single source: keep the controlled tab, pause the rest */
async function enforceSingle() {
  if (!P.single) return;
  try {
    const aud = await chrome.tabs.query({ audible: true });
    if (aud.length < 2) return;
    const keep = (controlledId && aud.some((t) => t.id === controlledId)) ? controlledId : aud[0].id;
    for (const t of aud) {
      if (t.id === keep) continue;
      try { await chrome.scripting.executeScript({ target: { tabId: t.id }, func: function () { document.querySelectorAll('audio,video').forEach(function (x) { x.pause(); }); } }); } catch (_) {}
    }
  } catch (_) {}
}

/* ---------- 7. Transport wiring ---------- */
$('btnPlay').onclick = () => act('toggle');
$('btnNext').onclick = () => act('next');
$('btnPrev').onclick = () => act('prev');
$('btnShuffle').onclick = () => act('shuffle');
$('btnRepeat').onclick = () => act('repeat');
$('btnLike').onclick = () => act('like');
$('btnDislike').onclick = () => act('dislike');
$('btnMute').onclick = async () => {
  const id = await resolveTarget(); if (id == null) return;
  try {
    const t = await chrome.tabs.get(id);
    await chrome.tabs.update(id, { muted: !(t.mutedInfo && t.mutedInfo.muted) });
    P.cmds++; setTimeout(pollOnce, 300);
  } catch (_) {}
};
$('seek').addEventListener('pointerdown', () => { seeking = true; });
window.addEventListener('pointerup', () => { seeking = false; });
$('seek').oninput = (e) => {
  if (lastProbe && lastProbe.duration > 0) {
    $('tCur').textContent = fmtT((e.target.value / 1000) * lastProbe.duration);
  }
};
$('seek').onchange = (e) => {
  seeking = false;
  if (lastProbe && lastProbe.duration > 0) act('seek', (e.target.value / 1000) * lastProbe.duration);
};
$('vol').addEventListener('pointerdown', () => { volDrag = true; });
window.addEventListener('pointerup', () => { volDrag = false; });
$('vol').onchange = (e) => {
  volDrag = false;
  const v = e.target.value / 100;
  if (lastProbe && lastProbe.site) { P.siteVols[lastProbe.site] = v; savePrefs(); }
  act('volume', v);
};
$('rgRate').oninput = (e) => {
  const r = e.target.value / 100;
  $('rateVal').textContent = (Math.round(r * 100) / 100) + 'x';
};
$('rgRate').onchange = (e) => act('rate', e.target.value / 100);
$('pollSel').onchange = (e) => { P.pollMs = +e.target.value; savePrefs(); restartPoll(); };
$('followSw').onchange = (e) => {
  P.follow = e.target.checked;
  if (!P.follow && controlledId != null) P.pinnedId = controlledId;
  if (P.follow) P.pinnedId = null;
  savePrefs(); pollOnce();
};
$('btnGoto').onclick = async () => {
  const id = await resolveTarget(); if (id != null) tabRowAction(id, 'goto');
};
$('btnLaunch').onclick = () => chrome.tabs.create({ url: 'https://music.youtube.com' });
document.querySelectorAll('.sitebtn').forEach((b) => {
  b.onclick = () => chrome.tabs.create({ url: b.dataset.site });
});

/* ---------- 8. Tools ---------- */
let sleepUntil = 0, sleepInt = null;
$('sleepSel').onchange = (e) => {
  const m = +e.target.value;
  clearInterval(sleepInt);
  if (!m) { sleepUntil = 0; $('sleepInfo').textContent = 'Pause the music after a while'; return; }
  sleepUntil = Date.now() + m * 60000;
  $('sleepInfo').textContent = 'Pauses at ' + new Date(sleepUntil).toLocaleTimeString();
  toast('Sleep in ' + m + ' min');
  sleepInt = setInterval(async () => {
    if (Date.now() < sleepUntil) return;
    clearInterval(sleepInt); sleepUntil = 0;
    const id = await resolveTarget();
    if (id != null) {
      if (P.duck) {
        for (let v = 0.8; v >= 0; v -= 0.2) { await exec(id, herosAct, ['volume', v]); await new Promise((r) => setTimeout(r, 400)); }
      }
      await exec(id, herosAct, ['pause', 0]);
      try { await chrome.scripting.executeScript({ target: { tabId: id }, func: function () { document.querySelectorAll('audio,video').forEach(function (x) { x.pause(); }); } }); } catch (_) {}
    }
    $('sleepInfo').textContent = 'Slept — timer done'; $('sleepSel').value = '0';
    toast('Sleep timer paused the music');
    pollOnce();
  }, 5000);
};
$('duckSw').onchange = (e) => { P.duck = e.target.checked; savePrefs(); };
$('singleSw').onchange = (e) => { P.single = e.target.checked; savePrefs(); toast('Single source ' + (P.single ? 'on — newcomers pause the rest' : 'off')); if (P.single) enforceSingle(); };
$('notifSw').onchange = (e) => { P.notif = e.target.checked; savePrefs(); toast('Song alerts ' + (P.notif ? 'on' : 'off')); if (P.notif && lastProbe && lastProbe.title) notifyTrack(lastProbe); };
$('stopSw').onchange = (e) => { P.stopAfter = e.target.checked; savePrefs(); toast('Stop after song ' + (P.stopAfter ? 'armed' : 'off')); };
$('volMemSw').onchange = (e) => { P.volMem = e.target.checked; savePrefs(); toast('Site volume memory ' + (P.volMem ? 'on' : 'off')); };
/* Fade-out timer */
let fadeUntil = 0, fadeTotal = 0, fadeStartVol = 1;
$('fadeSel').onchange = async (e) => {
  const m = +e.target.value;
  if (!m) { fadeUntil = 0; $('fadeInfo').textContent = 'Gently fade volume, then pause'; return; }
  fadeTotal = m * 60000; fadeUntil = Date.now() + fadeTotal;
  fadeStartVol = (lastProbe && lastProbe.volume) || 1;
  $('fadeInfo').textContent = 'Fading until ' + new Date(fadeUntil).toLocaleTimeString();
  toast('Fade-out over ' + m + ' min');
};
/* Focus: pause now, resume in 25 min */
let focusUntil = 0;
$('btnFocus').onclick = async () => {
  if (focusUntil) { focusUntil = 0; $('btnFocus').textContent = 'Start'; $('focusInfo').textContent = 'Pause now, auto-resume after'; return; }
  await act('pause'); P.cmds++;
  focusUntil = Date.now() + 25 * 60000;
  $('btnFocus').textContent = 'Stop'; $('focusInfo').textContent = 'Resumes ' + new Date(focusUntil).toLocaleTimeString();
  toast('Focus: silence for 25 min');
};
$('rgGoal').oninput = (e) => { $('goalVal').textContent = e.target.value + 'm'; };
$('rgGoal').onchange = (e) => { P.goalMin = +e.target.value; $('goalVal').textContent = P.goalMin + 'm'; savePrefs(); updateGoal(); };
/* Shared 10s ticker: fade + alarm + focus */
setInterval(async () => {
  try {
    if (fadeUntil) {
      const left = fadeUntil - Date.now();
      const id = controlledId;
      if (left <= 0) {
        fadeUntil = 0; $('fadeSel').value = '0'; $('fadeInfo').textContent = 'Faded out — done';
        if (id != null) { await exec(id, herosAct, ['pause', 0]); }
      } else if (id != null) {
        const v = Math.max(0, fadeStartVol * (left / fadeTotal));
        await exec(id, herosAct, ['volume', Math.round(v * 100) / 100]);
      }
    }
    if (focusUntil && Date.now() >= focusUntil) {
      focusUntil = 0; $('btnFocus').textContent = 'Start'; $('focusInfo').textContent = 'Pause now, auto-resume after';
      await act('toggle'); toast('Focus over — music back on');
    }
  } catch (_) {}
}, 10000);
function dl(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
$('btnExport').onclick = () => { dl(new Blob([JSON.stringify({ app: 'heros-player', v: 2, prefs: P })], { type: 'application/json' }), 'heros-player-prefs.json'); toast('Prefs exported'); };
$('btnImport').onclick = () => $('backupIn').click();
$('backupIn').onchange = async (e) => {
  try {
    const j = JSON.parse(await e.target.files[0].text());
    if (j.prefs) P = { ...DEF, ...j.prefs };
    applyPrefs(); savePrefs(); toast('Prefs restored');
  } catch (_) { toast('Bad backup file'); }
  e.target.value = '';
};
$('btnReset').onclick = () => {
  P = { ...DEF }; controlledId = null; lastKey = ''; seenKeys = new Set(); deepTabs = [];
  fadeUntil = 0; focusUntil = 0;
  applyPrefs(); savePrefs(); pollOnce(); refreshRadar(); toast('Reset done');
};

/* ---------- 9. Panes, menu, modal ---------- */
function switchPane(name) {
  document.querySelectorAll('.side-tab').forEach((b) => b.classList.toggle('active', b.dataset.pane === name));
  document.querySelectorAll('.side-pane').forEach((p) => p.classList.toggle('active', p.id === 'pane-' + name));
  if (name === 'tabs') refreshRadar();
}
document.querySelectorAll('.side-tab').forEach((b) => { b.onclick = () => switchPane(b.dataset.pane); });
function modal(html) { $('modalRoot').innerHTML = '<div class="modal-bg" id="mbg"><div class="modal">' + html + '</div></div>'; $('mbg').onclick = (e) => { if (e.target.id === 'mbg') closeModal(); }; }
function closeModal() { $('modalRoot').innerHTML = ''; }
function closeMenu() { const m = $('ctxmenu'); if (m) m.remove(); }
const ACCENTS = ['#4c8dff', '#22c55e', '#f59e0b', '#ef4444', '#8A2BE2', '#14b8a6'];
$('btnMenu').onclick = () => {
  closeMenu();
  const m = document.createElement('div'); m.className = 'menu'; m.id = 'ctxmenu';
  m.style.right = '12px'; m.style.top = '64px'; m.style.position = 'fixed';
  m.innerHTML = '<button data-k="follow">Follow playing: ' + (P.follow ? 'on' : 'off') + '</button>' +
    '<button data-k="keys">Keyboard shortcuts</button>' +
    '<div style="padding:8px 10px 4px;font-size:11px;color:var(--muted)">Accent</div>' +
    '<div style="display:flex;gap:6px;padding:0 10px 8px">' +
    ACCENTS.map((c) => '<button data-c="' + c + '" style="width:26px;height:26px;border-radius:50%;background:' + c + '" title="' + c + '"></button>').join('') +
    '<input type="color" id="accCustom" value="' + P.accent + '" title="Custom"></div>';
  document.body.appendChild(m);
  m.onclick = (ev) => {
    const c = ev.target.closest('button[data-c]');
    if (c) { P.accent = c.dataset.c; applyTheme(); savePrefs(); closeMenu(); return; }
    const k = ev.target.closest('button') ? ev.target.closest('button').dataset.k : null;
    if (!k) return;
    if (k === 'follow') { P.follow = !P.follow; $('followSw').checked = P.follow; savePrefs(); closeMenu(); pollOnce(); }
    if (k === 'keys') {
      modal('<h3>Keyboard shortcuts</h3><div style="display:grid;gap:7px;font-size:13px">' +
        [['Space', 'Play / Pause remote'], ['ArrowRight / Left', 'Seek ±10s'], ['ArrowUp / Down', 'Remote volume'], ['N / P', 'Next / Previous'], ['M', 'Mute tab'], ['L', 'Like (site)'], ['F', 'Star song (kept)'], ['C', 'Copy song'], ['1–4', 'Switch panes']].map((x) => '<div style="display:flex;justify-content:space-between"><span>' + x[0] + '</span><span class="kbd">' + x[1] + '</span></div>').join('') +
        '</div><button class="btn accent" id="keysOk" style="width:100%;margin-top:12px">Done</button>');
      $('keysOk').onclick = closeModal;
    }
  };
  const cc = $('accCustom');
  if (cc) cc.oninput = (ev) => { P.accent = ev.target.value; applyTheme(); savePrefs(); };
  setTimeout(() => document.addEventListener('click', (ev) => { if (!ev.target.closest('.menu') && !ev.target.closest('#btnMenu')) closeMenu(); }, { once: true }), 10);
};

/* ---------- 11. Keyboard ---------- */
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,select')) { if (e.key === 'Escape') e.target.blur(); return; }
  const k = e.key;
  if (k === ' ') { e.preventDefault(); act('toggle'); }
  else if (k === 'ArrowRight') { if (lastProbe && lastProbe.duration) act('seek', Math.min(lastProbe.duration - 0.5, lastProbe.currentTime + 10)); }
  else if (k === 'ArrowLeft') { if (lastProbe) act('seek', Math.max(0, lastProbe.currentTime - 10)); }
  else if (k === 'ArrowUp') { e.preventDefault(); if (lastProbe) act('volume', Math.min(1, lastProbe.volume + 0.05)); }
  else if (k === 'ArrowDown') { e.preventDefault(); if (lastProbe) act('volume', Math.max(0, lastProbe.volume - 0.05)); }
  else if (k === 'n' || k === 'N') act('next');
  else if (k === 'p' || k === 'P') act('prev');
  else if (k === 'm' || k === 'M') $('btnMute').click();
  else if (k === 'l' || k === 'L') act('like');
  else if (k === 'f' || k === 'F') toggleStar();
  else if (k === 'c' || k === 'C') copySong();
  else if (k >= '1' && k <= '4') switchPane(['control', 'tabs', 'songs', 'tools'][+k - 1]);
});

/* ---------- theme ---------- */
function applyTheme() {
  document.documentElement.dataset.theme = P.theme;
  document.documentElement.style.setProperty('--accent', P.accent);
  $('themeIcon').innerHTML = P.theme === 'dark'
    ? '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/>'
    : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
}
$('btnTheme').onclick = () => { P.theme = P.theme === 'dark' ? 'light' : 'dark'; applyTheme(); savePrefs(); };
function applyPrefs() {
  applyTheme();
  $('followSw').checked = P.follow;
  $('pollSel').value = String(P.pollMs);
  $('duckSw').checked = P.duck;
  $('singleSw').checked = !!P.single;
  $('notifSw').checked = !!P.notif;
  $('stopSw').checked = !!P.stopAfter;
  $('volMemSw').checked = !!P.volMem;
  $('stCmds').textContent = P.cmds;
  $('stTracks').textContent = P.seen;
  $('rgGoal').value = P.goalMin; $('goalVal').textContent = P.goalMin + 'm';
  rollDay(); updateGoal(); renderSongs(); syncSongCard();
}

/* ---------- 12. Boot ---------- */
let pollInt = null, radarInt = null;
function restartPoll() {
  clearInterval(pollInt);
  pollInt = setInterval(pollOnce, P.pollMs);
}
async function boot() {
  const t0 = performance.now();
  try { const p = await store.get('prefs', null); if (p) P = { ...DEF, ...p }; } catch (_) {}
  applyPrefs();
  document.body.classList.remove('boot');
  await refreshRadar();
  await pollOnce();
  restartPoll();
  clearInterval(radarInt);
  radarInt = setInterval(() => { if ($('pane-tabs').classList.contains('active')) refreshRadar(); else refreshRadarLite(); }, 4000);
  try {
    chrome.tabs.onUpdated.addListener(debounce(() => { refreshRadar(); pollOnce(); }, 900));
    chrome.tabs.onRemoved.addListener(debounce(() => { refreshRadar(); pollOnce(); }, 900));
  } catch (_) {}
  try { chrome.runtime.onMessage.addListener((m) => { if (m && m.type === 'heros-toggle') act('toggle'); }); } catch (_) {}
  setStatus('Ready — remote live (' + Math.round(performance.now() - t0) + 'ms boot)');
}
async function refreshRadarLite() {
  // cheap badge/chip sync without full probe
  try {
    const aud = await chrome.tabs.query({ audible: true });
    soundingTabs = aud;
    $('chipTabs').hidden = aud.length === 0;
    $('chipTabsN').textContent = aud.length + (aud.length === 1 ? ' sounding' : ' sounding');
    $('stTabs').textContent = aud.length;
    enforceSingle();
    if (P.follow && aud.length && aud[0].id !== controlledId) { pollOnce(); }
  } catch (_) {}
}
document.addEventListener('DOMContentLoaded', boot);
