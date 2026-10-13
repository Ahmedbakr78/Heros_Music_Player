'use strict';
/* Heros Player — panel-only background service worker (MV3).
   No popup. Everything opens in the Side Panel. */

const PANEL = 'sidepanel.html';

async function openPanel(windowId) {
  try {
    if (windowId != null) await chrome.sidePanel.open({ windowId });
    else {
      const win = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: win.id });
    }
  } catch (e) {
    // Fallback: open in a tab if side panel API unavailable
    try { await chrome.tabs.create({ url: PANEL }); } catch (_) {}
  }
}

/* Toolbar click -> panel only */
chrome.action.onClicked.addListener(async (tab) => {
  try { await chrome.sidePanel.setOptions({ path: PANEL, enabled: true }); } catch (_) {}
  await openPanel(tab ? tab.windowId : undefined);
});

/* Panel behavior: open on action click (Chrome 114+) */
try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
} catch (_) {}

/* First install: enable panel + context menu */
chrome.runtime.onInstalled.addListener(async () => {
  try { await chrome.sidePanel.setOptions({ path: PANEL, enabled: true }); } catch (_) {}
  try {
    chrome.contextMenus.create({ id: 'heros-open', title: 'Open Heros Player', contexts: ['all'] });
    chrome.contextMenus.create({ id: 'heros-play-pause', title: 'Play / Pause (Heros Player)', contexts: ['all'] });
  } catch (_) {}
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'heros-open') await openPanel(tab ? tab.windowId : undefined);
  if (info.menuItemId === 'heros-play-pause') {
    try { await chrome.runtime.sendMessage({ type: 'heros-toggle' }); } catch (_) {}
    // Also toggle loudest audible tab media directly
    try {
      const tabs = await chrome.tabs.query({ audible: true });
      for (const t of tabs) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: t.id },
            func: () => {
              const els = [...document.querySelectorAll('video,audio')];
              if (!els.length) return 'none';
              const playing = els.some(e => !e.paused && !e.ended);
              els.forEach(e => { if (playing) e.pause(); else e.play().catch(() => {}); });
              return playing ? 'paused' : 'playing';
            }
          });
        } catch (_) {}
      }
    } catch (_) {}
  }
});

/* Badge: show speaker dot when any tab is audible (like YouTube Music playing) */
async function refreshBadge() {
  try {
    const tabs = await chrome.tabs.query({ audible: true });
    const n = tabs.length;
    if (n > 0) {
      await chrome.action.setBadgeText({ text: String(n) });
      await chrome.action.setBadgeBackgroundColor({ color: '#4c8dff' });
      await chrome.action.setTitle({ title: `Heros Player — ${n} tab(s) playing sound` });
    } else {
      await chrome.action.setBadgeText({ text: '' });
      await chrome.action.setTitle({ title: 'Open Heros Player' });
    }
  } catch (_) {}
}

chrome.tabs.onUpdated.addListener(refreshBadge);
chrome.tabs.onRemoved.addListener(refreshBadge);
chrome.tabs.onCreated.addListener(refreshBadge);
setInterval(refreshBadge, 5000);
refreshBadge();

/* Messages from panel */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'heros-open-panel') { openPanel(); sendResponse({ ok: true }); return true; }
});
