# REPO_META — GitHub About box, topics, website setup (copy-paste kit)

Repo: `https://github.com/Ahmedbakr78/Heros_Music_Player`
Website: `https://ahmedbakr78.github.io/Heros_Music_Player/`

## 1. About box (repo header — Settings → General, or `gh repo edit`)

**Description (copy-paste, no emojis):**

```text
Heros Player — full remote for YouTube Music, YouTube, Spotify and any media tab. Live song readout, seek, volume, shuffle, repeat, likes. Panel-only, free and unlimited.
```

**Website:**

```text
https://ahmedbakr78.github.io/Heros_Music_Player/
```

Applied automatically with:

```bash
gh repo edit Ahmedbakr78/Heros_Music_Player \
  --description "Heros Player — full remote for YouTube Music, YouTube, Spotify and any media tab. Live song readout, seek, volume, shuffle, repeat, likes. Panel-only, free and unlimited." \
  --homepage "https://ahmedbakr78.github.io/Heros_Music_Player/"
```

## 2. Topics (Settings → General → Topics, max 20)

```text
chrome-extension, manifest-v3, side-panel, youtube-music, youtube,
spotify, soundcloud, media-controller, now-playing, mediasession,
remote-control, tab-manager, dark-mode, offline-first, privacy,
open-source, javascript, brave, edge-extension, free
```

Applied automatically with (replaces the full set):

```bash
gh repo edit Ahmedbakr78/Heros_Music_Player --add-topic chrome-extension --add-topic manifest-v3 --add-topic side-panel --add-topic youtube-music --add-topic youtube --add-topic spotify --add-topic soundcloud --add-topic media-controller --add-topic now-playing --add-topic mediasession --add-topic remote-control --add-topic tab-manager --add-topic dark-mode --add-topic offline-first --add-topic privacy --add-topic open-source --add-topic javascript --add-topic brave --add-topic edge-extension --add-topic free
```

## 3. Website (GitHub Pages — Settings → Pages)

- Source: **Deploy from a branch**
- Branch: **main** — folder: **/docs**
- URL after deploy: `https://ahmedbakr78.github.io/Heros_Music_Player/`
- Config: `_config.yml` at repo root (theme, title, description)
- Custom domain: optional — add `CNAME` file with your domain when ready

## 4. Social preview (Settings → General → Social preview)

- Upload: `docs/screenshots/social.png` (1280×640, app hero + tagline)
- Falls back to the logo (`heros-player-extension/icons/logo.png`) until then

## 5. Releases (already automated)

- Push a tag `vX.Y.Z` → `release.yml` zips `heros-player-extension/`,
  creates the GitHub Release, pastes `RELEASE_vX.Y.Z.md` as notes.
- Keep `CHANGELOG.md` top entry + `manifest.json` version + tag in sync
  (`ci.yml` fails the PR otherwise).

## 6. Full one-shot setup (run from repo root)

```bash
gh repo edit Ahmedbakr78/Heros_Music_Player \
  --description "Heros Player — full remote for YouTube Music, YouTube, Spotify and any media tab. Live song readout, seek, volume, shuffle, repeat, likes. Panel-only, free and unlimited." \
  --homepage "https://ahmedbakr78.github.io/Heros_Music_Player/" \
  --add-topic chrome-extension --add-topic manifest-v3 --add-topic side-panel \
  --add-topic youtube-music --add-topic youtube --add-topic spotify \
  --add-topic soundcloud --add-topic media-controller --add-topic now-playing \
  --add-topic mediasession --add-topic remote-control --add-topic tab-manager \
  --add-topic dark-mode --add-topic offline-first --add-topic privacy \
  --add-topic open-source --add-topic javascript --add-topic brave \
  --add-topic edge-extension --add-topic free
gh release view v1.1.0 >/dev/null && echo "release live"
```
