# locki-io — project contract & router

> Root law lives in `~/.claude/CLAUDE.md`. This file never restates it — it routes.

## What this repo is

The Vaettir realm's **public homepage** — [www.locki.io](https://www.locki.io) — a static Vite site served by GitHub Pages from the org-repo `locki-io.github.io`. A **free electron** (no runtime, no ports). **Dual-plane:** commits and deploy live here on GitHub; issues, wiki and the IP trail live on the forge.

## Router — where each kind of thing goes

| Kind | Home |
|---|---|
| **STATE** — how it is built | Arc42 shelves: `locki/docs/locki-io/01…12-*.md` (airlock, through the `locki` symlink) |
| **INTENT** — what we want next | Forge issues: `https://forge.lockilabs.com/lockilabs/locki-io` — three-axis labels `arc42:* / drawer:* / status:*` |
| **LEARNINGS** | `project/MEMORY-project.md` (open week, local) + harness memory |
| **COMMANDS** | `README.md` · `project/cli-cheatsheet.md` |
| **PUBLIC DOOR** | `locki/docs/locki-io/overview.md` → docs.locki.io |

## Planes & voices

- **`origin` (GitHub) = ship.** Push to `main` deploys. Work on `dummit/*`; squash-merge to `main` with one message.
- **`yggdrasil` (forge) = think.** Fetch-only pull-mirror of `origin`. Never push to it.
- GitHub Issues / Wiki / Projects / Discussions are **off by design** — discuss on the forge.
- **Commit voice, mixed by task:** Lífþrasir (substrate, the tree) · Niove (UI/UX) · operator (releases, squash to `main`). Every commit ends `Co-Authored-By: Vaettir Agents <agents@vaethir.com>`.

## Env

Owns **`.env.config` only** (CONFIG class — never rotates). Template: `env-templates/env.config.example`. **No secrets belong in this repo** — it is public.

## Priority (operator, 2026-08-30)

Forge #2 *the story* — **act by act**, one `dummit/actN-*` thread and one forge issue per act, every act on the stage (#4/#5). The real-data tree (#1, superseded) is **Acts III–IV**: the trunk from blog frontmatter, the branches from the agents' commits. See Arc42 §4.

## Do not

- Rename the GitHub repo — the name is Pages infrastructure.
- Give `.header-container` `position: relative` — it re-anchors the milestone circles (Arc42 §11).
- Commit `project/`, `locki`, `dist/`, `.env*`.
