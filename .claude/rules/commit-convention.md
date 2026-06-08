---
description: Enforces conventional commit format when creating git commits
globs: 
alwaysApply: true
---

# Commit Convention

All commit messages MUST follow Conventional Commits format in English.

## Format

```
<type>(<scope>): <description>

[optional body]
```

## Rules

1. **Type is required**. Allowed types:
   - `feat` — new feature
   - `fix` — bug fix
   - `chore` — maintenance, dependencies, config
   - `docs` — documentation only
   - `refactor` — code change that neither fixes a bug nor adds a feature
   - `perf` — performance improvement
   - `test` — adding or updating tests
   - `style` — formatting, missing semicolons, etc (no code change)
   - `ci` — CI/CD changes
   - `build` — build system or external dependencies

2. **Scope is required**. Must reflect the area of change:
   - Examples: `level-editor`, `gameplay`, `ui`, `audio`, `physics`, `networking`, `build`, `config`
   - Use kebab-case
   - Keep it short and consistent across commits

3. **Description is required**:
   - Lowercase first letter (no capital)
   - No period at the end
   - Imperative mood: "add" not "added" or "adds"
   - Max 72 characters for the first line

4. **Language**: English only. Never use Vietnamese or other languages in commit messages.

5. **Body** (optional): Use for explaining "why" not "what". Wrap at 72 characters.

6. **No Co-Authored-By**: Do NOT append any Co-Authored-By trailer.

## Examples

```
feat(level-editor): add cell mechanic selector panel
fix(gameplay): resolve stall sorting order on conveyor
chore(config): update Claude Code permissions and MCP config
refactor(level-editor): extract tray grid into reusable component
docs(readme): add setup instructions for new developers
perf(rendering): reduce draw calls in stall rendering
test(level-editor): add unit tests for level validator
```

## Anti-patterns (DO NOT)

```
feat: add feature                    # missing scope
feat(level-editor): Add feature      # capitalized description
feat(level-editor): add feature.     # period at end
feat(level-editor): added feature    # past tense
Update level editor                  # no type or scope
fix(LevelEditor): fix bug            # scope not kebab-case
```