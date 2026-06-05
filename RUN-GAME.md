# Animal World Zoo — How to run

The game is a browser React app. The dev build (`Animal World Zoo.html`) loads
React/ReactDOM/Babel from a CDN and then fetches `act/*.jsx` at runtime. Browsers
block those fetches over `file://`, so the game must be served over `http://`.

There is **no Node / npm / Python** required — the launcher uses a tiny static
web server built into PowerShell (`System.Net.Sockets.TcpListener`), so it needs
no install and no admin rights.

## Run it

Double-click **`run-game.cmd`**, or from a terminal:

```powershell
.\run-game.ps1
```

This starts the server on http://localhost:8080/ and opens the dev build in your
default browser. Press **Ctrl+C** in the window to stop.

### Options

```powershell
.\run-game.ps1 -Port 9000                                   # different port
.\run-game.ps1 -Page "Animal World Zoo (mobile).html"       # mobile dev build
.\run-game.ps1 -NoBrowser                                   # server only
```

| Page | What it is |
|------|------------|
| `Animal World Zoo.html` (default) | Desktop dev build — edits to `act/*.jsx` show on refresh |
| `Animal World Zoo (mobile).html` | Mobile dev build |
| `Animal World Zoo (standalone).html` | Self-contained single file (everything inlined) |
| `Animal World Zoo (mobile, standalone).html` | Self-contained mobile build |

The **standalone** files inline everything and can also just be double-clicked
to open directly (no server) — but you'd be editing the 1.8 MB inlined file
instead of the `act/` sources. Use the dev build for development.

## Editing the game

Source lives in [act/](act/) — `.jsx` (React components, loaded by `text/babel`)
and `.css`. Edit a file, then refresh the browser. No build step.

---

# Claude Code Game Studios (the studio framework)

This folder also has the [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)
framework installed at the root: `.claude/` (49 agents, 73 skills, hooks, rules),
`CLAUDE.md`, and the `design/ docs/ production/ src/` scaffolding. The original
clone is kept in [Claude-Code-Game-Studios/](Claude-Code-Game-Studios/) for
reference and upgrades.

Open this folder in Claude Code and type `/` to see the skills. Good starting
points for an existing project like this one:

- `/project-stage-detect` — analyze what already exists
- `/start` — guided onboarding
- `/adopt` — bring existing code under the studio workflow

> Note: the framework's `CLAUDE.md` and engine reference default to Godot. This
> game is **Web / React (in-browser Babel)**. Run `/setup-engine` (or just edit
> `CLAUDE.md`) if you want the agents configured for the web stack.
