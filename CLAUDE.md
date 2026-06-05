# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: None — vanilla web (browser-native, no game engine)
- **Framework**: React 18.3.1 + ReactDOM 18.3.1 (UMD, loaded from unpkg CDN)
- **Language**: JavaScript / JSX, transpiled in-browser by @babel/standalone 7.29.0
- **Build System**: None — no bundler/transpile step; `.jsx` is fetched and compiled at runtime by Babel
- **Asset Pipeline**: Static files served over HTTP; fonts from Google Fonts (Plus Jakarta Sans)
- **Run**: `run-game.ps1` / `run-game.cmd` — dependency-free PowerShell static server (see `RUN-GAME.md`)
- **Version Control**: Git with trunk-based development

> **Note**: This project does NOT use Godot/Unity/Unreal, so the engine-specialist
> agents (`godot-specialist`, `unity-specialist`, `unreal-specialist`) and the
> `/setup-engine` skill do not apply. Code lives in `act/*.jsx` (React components)
> and `act/*.css`. There is no compile step — edit a source file and refresh the
> browser. Treat `ui-programmer` / `ux-designer` / `gameplay-programmer` as the
> relevant specialists for this web codebase.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

No game engine is used. Pinned web dependencies (loaded from CDN at runtime):

- React / ReactDOM **18.3.1**
- @babel/standalone **7.29.0** (in-browser JSX transpile)

These are referenced by `<script>` tags in the `Animal World Zoo*.html` files with
Subresource Integrity hashes. Bump versions there if upgrading.

## Technical Preferences

@.claude/docs/technical-preferences.md

## Coordination Rules

@.claude/docs/coordination-rules.md

## Collaboration Protocol

**User-driven collaboration, not autonomous execution.**
Every task follows: **Question -> Options -> Decision -> Draft -> Approval**

- Agents MUST ask "May I write this to [filepath]?" before using Write/Edit tools
- Agents MUST show drafts or summaries before requesting approval
- Multi-file changes require explicit approval for the full changeset
- No commits without user instruction

See `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` for full protocol and examples.

> **First session?** If the project has no engine configured and no game concept,
> run `/start` to begin the guided onboarding flow.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
