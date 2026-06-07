# Claude Code Game Studios -- Game Studio Agent Architecture

Indie game development managed through 49 coordinated Claude Code subagents.
Each agent owns a specific domain, enforcing separation of concerns and quality.

## Technology Stack

- **Engine**: Unity **6.3 LTS** (`6000.3.17f1`), 2D
- **Language**: C# (.NET, C# 9)
- **Rendering**: Universal Render Pipeline (URP) 2D
- **UI**: UI Toolkit (UXML + USS) — the Unity 6 runtime UI default (replaces UGUI)
- **Input**: Input System package
- **Build System**: Unity Build Pipeline
- **Asset Pipeline**: Unity Asset Import Pipeline (Addressables deferred — not used for MVP)
- **Target Platforms**: Mobile (iOS / Android) primary + WebGL
- **Version Control**: Git with trunk-based development

> **Note**: The shipping target is a **Unity 2D** app. The React 18 / Babel / DOM build
> in `act/*.jsx` is retained as the **playable reference prototype** (rules/feel reference),
> NOT the shipping codebase. The 13 GDDs are authoritative for rules, formulas, and balance;
> their JSX "Source files" notes are read as prototype reference. Game code lives in C#
> (`Assets/Scripts/**`); route work to `unity-specialist` (architecture + C#),
> `unity-ui-specialist` (UI Toolkit), and `unity-shader-specialist` (URP materials/shaders).
> See `docs/architecture/architecture.md` for the Unity blueprint.

## Project Structure

@.claude/docs/directory-structure.md

## Engine Version Reference

@docs/engine-reference/unity/VERSION.md

> Engine pinned at Unity 6.3 LTS (`6000.3.17f1`). Unity 6 is **post-LLM-cutoff** —
> always check `docs/engine-reference/unity/` (breaking-changes, deprecated-apis,
> current-best-practices, modules/) before suggesting any Unity API.
> `ProjectSettings/ProjectVersion.txt` is pinned to `6000.3.17f1` — install that editor
> patch in Unity Hub before opening the project.
>
> Reference prototype only (not shipping): React/ReactDOM 18.3.1 + @babel/standalone
> 7.29.0, loaded via CDN in the `Animal World Zoo*.html` files.

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
>
> **Continuing an in-progress project? READ `docs/AI-HANDOFF.md` FIRST.** It is the
> single entry point that tells you the current state, the source-of-truth map, what to
> check, and how to pick the next task (the prioritized worklist is
> `docs/project-workflow-backlog-2026-06-07.csv`). Do this before any work, even if the
> user did not explicitly ask.

## Coding Standards

@.claude/docs/coding-standards.md

## Context Management

@.claude/docs/context-management.md
