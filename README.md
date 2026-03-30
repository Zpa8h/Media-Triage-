# Media Triage

A local web app for sorting large media libraries without touching a single file. Point it at a directory, work through your files one by one, then export a shell script of `mv` commands to run when you're ready.

```
Scan → Configure → Triage → Export
```

Nothing moves automatically. The app only generates scripts.

---

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Run

```bash
# Foreground (ctrl+c to stop)
npm run dev

# Background (frees your terminal)
npm run dev:bg
npm run stop        # stop background servers

# View background logs
tail -f triage.log
```

Open **http://\<your-ip\>:5173** in a browser. The server prints the exact URL on startup.

---

## The four phases

### 1 — Scan

Enter an absolute path to your media library. The scanner walks the directory tree and finds all media files (`.epub`, `.mp3`, `.m4b`, `.mkv`, `.mp4`, `.pdf`, and more).

For each file it computes a **split point** — the highest ancestor directory where the tree branches — and highlights the unique portion of the path. The scan result is saved as a JSON session file in `triage-sessions/`.

### 2 — Configure

Give the session a label and define 2–8 destination buckets. Each bucket has:
- A short label (e.g. *Keep*, *Self-Help*, *Archive*, *Delete*)
- An optional absolute destination path (leave blank for "leave in place")
- A colour, used to tint the decision button

### 3 — Triage

Cards are shown one at a time. Each card shows the filename, the full path with the unique segment highlighted, the file format and size, and a notes field.

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `←` / `→` | Previous / next card |
| `1` – `4` | Assign to that bucket |
| `S` | Skip |
| `N` | Focus notes field |
| `Esc` | Blur notes field |

Decisions are written to disk immediately — no save button. Close the browser at any point; reopen to resume exactly where you left off.

Use the filter bar to view **All / Undecided / Skipped / Decided** cards independently.

### 4 — Export

A summary shows the count per bucket. Click **Generate script** to produce a bash script of `mv` commands. The script is:

- Saved to `triage-sessions/` with a timestamp
- Shown in a syntax-highlighted viewer in the UI
- **Not run automatically** — copy it, review it, run it yourself

```bash
#!/bin/bash
# Media Triage Export — My Ebook Library — 2026-03-30
# Review carefully before running. This script will move files.

# --- Self-Help (34 files) ---
mv "/Library/AuthorA/book1.epub" "/Library/Self-Help/book1.epub"
# ...
```

---

## Session files

Sessions are stored as human-readable JSON in `triage-sessions/`. You can inspect or edit them manually. The filename is `<session-id>.json`; the UUID inside is the canonical identifier.

Previous sessions are listed on the Scan screen so you can resume or review them at any time.

---

## Supported file types

`.epub` `.cbz` `.cbr` `.pdf` `.mobi` `.azw` `.azw3` `.djvu`
`.mp3` `.m4b` `.m4a` `.flac` `.ogg` `.wav`
`.mkv` `.mp4` `.avi` `.mov` `.wmv`

---

## Production build

```bash
npm run build       # compiles React into dist/
npm start           # serves everything from Express on :3001
```

In production a single process serves both the API and the built frontend.

---

## Project structure

```
server/
  index.js          Express server and API routes
  scanner.js        Directory walk + split-point algorithm
  scanner.test.js   Unit tests for split-point logic (node --test)
  sessions.js       Atomic JSON read/write helpers
  export.js         Shell script generator

client/src/
  App.jsx           Phase router (URL query params, no React Router)
  api.js            All fetch() calls in one place
  hooks/
    useSession.js   Load session, expose mutators
  phases/
    Scan.jsx        Phase 1
    Configure.jsx   Phase 2
    Triage.jsx      Phase 3
    Export.jsx      Phase 4
  components/
    Card.jsx        Triage flashcard
    PathDisplay.jsx Dim prefix + highlighted bold segment
    ProgressBar.jsx Always-visible decided/total bar
    FilterBar.jsx   All / Undecided / Skipped / Decided
    OptionButton.jsx  Coloured decision button
    ScriptViewer.jsx  Syntax-highlighted script preview

triage-sessions/    Created at runtime; holds *.json and *.sh files
```

## Tests

```bash
npm test
```

Runs the split-point unit tests (11 cases, including all five examples from the spec).
