# Changelog

All notable changes to Heros Player. Versions follow SemVer. The manifest
version, the top entry here, and the release tag must always agree (CI fails
if they do not).

## [1.1.1] - 2026-10-13

### Fixed
- Pause no longer switches songs: the toggle now pauses the media element
  directly instead of clicking the first Play/Pause-labeled button on the
  page (which could be a playlist "Play" button starting another song).
- All remote button clicks are scoped to the player bar first
  (`ytmusic-player-bar`, `#player`, …) with tight exact-label matching, so
  Play / Next can never hit shelf or card buttons ("Play next", "Play all").
  Document-wide search is only a fallback.

## [1.1.0] - 2026-10-13

### Changed (the big refocus)
- Heros Player is now a **pure remote**: the entire local-file player
  (library, IndexedDB vault, EQ graph, demo synth, lyrics, playlists,
  recorder, metronome, todo) was removed. No local playback, no files —
  full detection + full control of YouTube Music and every media tab.
- Panes are now **Control | Tabs | Songs | Tools** (Features pane removed;
  the universe list lives in `docs/FEATURES.md` and this README).

### Added
- Song-change OS notifications (new `notifications` permission, toggleable)
- Stop-after-this-song auto-pause on track change
- Per-site volume memory with auto-restore
- Close-duplicates tab cleanup, mute-by-site, pin/unpin + reload player tab
- Top-played auto ranking, song filter search, history TXT export
- Volume presets 25/50/75/100%, cover-click jumps to tab, `C` copies song
- Deep scan for hidden media tabs, single-source mode, fade-out timer,
  alarm, focus-25, sleep timer, starred songs, notes, history, daily goal

### Fixed
- Optional-chaining + brace balance verified with bun build on every change
- All 89 widget IDs cross-checked between `sidepanel.html` and `sidepanel.js`

## [1.0.0] - 2026-10-13

### Added
- First release: panel-only MV3 remote (`side_panel`, no popup)
- Live probe/act engine (`herosProbe` / `herosAct` via `chrome.scripting`)
- Sounding radar + music-site standby list, pause/mute all, toolbar badge
- Hero readout (title, artist, album, cover), seek, volume, speed, shuffle,
  repeat, like/dislike with live pressed-state
- Sleep timer, quick launchers, prefs backup, Heros design copy
