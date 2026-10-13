# Heros Player v1.1.1 — Pause-fix patch

> Fixes: pressing pause could switch to another song. The toggle now pauses
> the media element directly, and every remote click is scoped to the player
> bar with exact-label matching.

## Fixed

- **Pause never switches songs again** — no more clicking the first
  Play/Pause-labeled button on the page (a playlist "Play" button could hijack
  playback). Pausing drives the audio element directly.
- **Player-bar scoping** — Next / Play / Shuffle clicks search
  `ytmusic-player-bar` / `#player` first; exact labels only
  (`Play`, `Play (k)`, `Next` — never `Play next` / `Play all`).
  Page-wide search is a fallback only.
- Same scoping applied to probe detection (Next/Previous presence).

## Install / update (30 seconds)

Reload the extension on `chrome://extensions` (Developer mode → reload icon
on the Heros Player card), or load the attached
`heros-player-v1.1.1.zip` unpacked. Full guide:
[`docs/INSTALLATION.md`](https://github.com/Ahmedbakr78/Heros_Music_Player/blob/main/docs/INSTALLATION.md).
