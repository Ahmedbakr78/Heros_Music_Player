# Diagrams — the whole system on one page

Every diagram is Mermaid — renders on GitHub, the Pages site, and any modern
Markdown viewer. Sources of truth live in `README.md`; this page is the
gallery.

## 1. System overview

```mermaid
flowchart TB
    subgraph Browser["Browser: Chrome / Edge / Brave"]
        Panel["sidepanel.html + sidepanel.js<br/>THE REMOTE (panel only)"]
        BG["background.js<br/>service worker"]
        YTM["music.youtube.com<br/>audio element + player-bar DOM"]
        YT["youtube.com / spotify / ...<br/>media elements"]
    end
    subgraph Store["Local only"]
        LS[("chrome.storage.local<br/>prefs + stars + history")]
    end
    User(["User"]) -->|click / keys| Panel
    Panel -->|scripting: probe/act| YTM
    Panel -->|scripting: probe/act| YT
    Panel -->|tabs: query/mute/pin| Browser
    Panel <--> LS
    BG -->|badge + menu| Browser
```

## 2. Remote pipeline (poll loop)

```mermaid
flowchart TB
    Scan(["query audible + standby + scan"]) --> Pick["resolveTarget()"]
    Pick --> Probe["herosProbe → 14-field JSON"]
    Probe --> Diff["track/site change?"]
    Diff --> UI["hero + transport paint"]
    Diff --> FX["history, notify, stop, vol-mem"]
    UI --> Wait["wait pollMs"]
    FX --> Wait
    Wait --> Scan
```

## 3. Probe engine

```mermaid
flowchart LR
    M["media element"] --> O["state JSON"]
    MD["MediaSession.metadata"] --> O
    YT["YTM player-bar DOM"] --> O
    BT["button aria-labels"] --> O
```

## 4. Act engine (nine verbs)

```mermaid
flowchart TB
    A["act(verb, value)"] --> T["toggle → button or media"]
    A --> C["next/prev/shuffle/repeat/like → real buttons"]
    A --> D["seek/volume/rate → media element"]
    A --> E["pause → media.pause()"]
```

## 5. First detection

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as Panel
    participant T as YTM tab
    U->>T: press play
    P->>P: audible query finds T
    P->>T: executeScript(herosProbe)
    T-->>P: song JSON
    P-->>U: live remote ~1s
```

## 6. Seek without fighting the poll

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as Panel
    participant T as Tab
    U->>P: drag (seeking = true)
    P->>P: local preview only
    U->>P: release → act(seek, t)
    P->>T: currentTime = t
```

## 7. Single-source auto-pause

```mermaid
sequenceDiagram
    autonumber
    participant A as Controlled tab
    participant B as New tab
    participant P as Panel
    B->>P: becomes audible
    P->>B: pause media
    P-->>A: uninterrupted
```

## 8. Privacy boundary

```mermaid
flowchart TB
    Tab(["tab state"]) --> Local["in-page probe → panel JSON"]
    Local --> Save[("local storage only")]
    Local -.->|NEVER| Net(("internet"))
    style Net fill:#dc2626,color:#fff
    style Local fill:#16a34a,color:#fff
```

## 9. Release pipeline

```mermaid
flowchart LR
    DEV["branch"] --> PR["PR"] --> CI["ci.yml"] --> MERGE["main"]
    MERGE --> PAGES["Pages: docs/"]
    MERGE --> TAG["tag"] --> REL["release.yml → zip + Release"]
```
