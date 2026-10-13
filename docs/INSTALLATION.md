# Installation — 30 Seconds

Heros Player runs in **Chrome, Edge, Brave, Opera, Arc and Vivaldi** — any
current Chromium browser. The steps are identical; only the extensions-page
URL changes.

## Option A — Load unpacked (recommended, 30 seconds)

```bash
git clone https://github.com/Ahmedbakr78/Heros_Music_Player.git
cd Heros_Music_Player
```

1. Open your browser's extensions page:

   | Browser | Type in the address bar |
   |---|---|
   | Google Chrome | `chrome://extensions` |
   | Microsoft Edge | `edge://extensions` |
   | Brave | `brave://extensions` |
   | Opera | `opera://extensions` |
   | Arc | `arc://extensions` |
   | Vivaldi | `vivaldi://extensions` |

2. Enable **Developer mode** (toggle, usually top-right).
3. Click **Load unpacked** and select `Heros_Music_Player/heros-player-extension/`.
4. The Heros Player card appears (v1.1.0). Click the toolbar icon —
   the **side panel** opens. Done!

## Option B — Release zip (no git)

1. Download `heros-player-v1.1.0.zip` from
   [Releases](https://github.com/Ahmedbakr78/Heros_Music_Player/releases).
2. Unzip it anywhere.
3. Follow steps 1–4 above with the unzipped folder.

## Smoke test (10 seconds)

1. Open [music.youtube.com](https://music.youtube.com) and press play.
2. The panel hero shows the song + cover within ~1 second.
3. Press `Space` — music pauses. Press `→` — next track. Drag the seek bar.

If the panel says "Nothing detected", the tab isn't sounding yet — press play
on the site first, or use **Tabs → Deep scan** to find paused players.

## Permissions explained

| Permission | Why |
|---|---|
| `sidePanel` | The app's only home |
| `tabs` | Find sounding tabs, mute/pin/reload them |
| `scripting` | Run the probe/act reader on music pages |
| `storage` | Prefs, stars, history — your profile only |
| `contextMenus` | Right-click Play/Pause + Open |
| `notifications` | Song-change alerts (toggleable, off by default) |
| `tabCapture` | Reserved for future loudness work (unused today) |
| `<all_urls>` | Lets the probe run on any music site |

## Uninstall

Remove the extension from the extensions page. Prefs, stars and history live
in `chrome.storage.local` and vanish with it.
