# Contributing to Heros Player

Thanks for helping — one logical change per PR, tested like you mean it.

## Ground rules

- Edit only inside `heros-player-extension/`. Never touch anything outside
  your change's scope.
- No frameworks, no bundlers, no build step. Vanilla HTML/CSS/JS.
- No network calls. The probe reads tab state; nothing may leave the device.
- No new permissions without an approved issue first.
- No emojis in repo docs (CI enforces it).
- Match the Heros design tokens (radii 20/14/11/7 + pill, floating cards).

## Test matrix (every PR)

1. YouTube Music + one more site (Spotify, YouTube, SoundCloud…).
2. Dark + light theme.
3. ~300px panel width (the real home).
4. Parse check: `node --check` on both JS files (CI does this too).
5. Poll Turbo/Normal/Calm each for a minute with a real song.

## Commits

Conventional prefixes: `feat/`, `fix/`, `docs/`, `style/`, `perf/`,
`chore/`. Example: `feat: mute-by-site for soundcloud subdomains`.

User-facing change? Add a `CHANGELOG.md` entry under Unreleased (maintainer
folds it into the next version).

## PR flow

Fork → branch `feat/my-thing` → PR with the template filled → CI green →
review + smoke test → merge. Releases ride on tags (`vX.Y.Z`), cut by the
maintainer with notes from `RELEASE_vX.Y.Z.md`.
