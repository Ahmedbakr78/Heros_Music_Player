# Privacy — the full picture

**One sentence: Heros Player cannot see your data because it never sends it
anywhere. There is no server to send it to.**

## What the extension can technically touch

| Capability | Used for | Leaves device? |
|---|---|---|
| Read player state (title, time, volume) | Showing the remote | No |
| Click play/next/like buttons | Your commands only | No (acts inside the tab) |
| Tab titles + URLs + mute flags | Radar lists, mute, pin | No |
| `chrome.storage.local` | Prefs, stars, history, stats | No (profile-local) |
| Notifications | Song alerts you toggled | No (OS-local) |

## What it never does

- No `fetch`, no `XMLHttpRequest`, no beacons, no analytics SDKs.
- No account, no login, no sync, no cookies set by us.
- Cover art loads from the site's own artwork URL into the panel `<img>` —
  the same image your browser already fetched to show the tab.
- The `<all_urls>` host permission exists so the probe can run on any music
  site; the probe function only reads media/player state.

## Verify it yourself (2 minutes)

1. Load the extension unpacked.
2. Open DevTools → Network for the panel page, use it for a minute.
3. Filter: you will see **zero** requests except the artwork images the sites
   themselves serve (same as having the tab open).
4. Search the source: `grep -r "fetch(" heros-player-extension/` returns nothing.

## Data control

- **Export**: Tools → Export prefs / Songs → Export (JSON/TXT). Human-readable.
- **Wipe**: Tools → Reset, or remove the extension (storage goes with it).
- **Ask us anything**: [Support](./SUPPORT.md) — or open a public discussion;
  there is nothing to hide.

## Vulnerability reports

Please **do not** open a public issue for security bugs — see
[`SECURITY.md`](../SECURITY.md) for the private channel.
