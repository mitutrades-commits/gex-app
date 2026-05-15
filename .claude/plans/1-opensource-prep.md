# Plan: Open-Source Preparation

**Date:** 2026-05-14  
**Branch:** feature/nav-redesign  
**Goal:** Curate the codebase for public release targeting Flash Alpha API users; add license, contribution guidelines, and update all documentation to reflect the current codebase state.

---

## Context

The codebase was originally a private development repo with a CLAUDE.md written for AI-assisted development and a README that reflected an earlier architecture. The goal is to make it forkable by Flash Alpha users who want to self-host a GEX dashboard, while:

- Preventing commercial use without the author's consent
- Encouraging community contributions via a clear workflow
- Ensuring new users can get running with zero prior context

---

## Changes Made

### 1. LICENSE (new)

Personal Use License:
- Free for personal, non-commercial use
- Commercial use requires written consent from the author
- Contributors grant the author perpetual license to their contributions

### 2. README.md (rewrite)

Updated to reflect current architecture:
- Accurate file tree (shell/, views/, hooks/ structure)
- Quick Start using `uv` (matches actual toolchain)
- Adapter table (seed vs flash_alpha)
- Full API reference including `/intraday` and `/dealer-risk`
- Environment variable table for both backend and frontend
- Contributing section with PR workflow and guidelines

### 3. CLAUDE.md (rewrite)

Brought in line with current codebase:
- Corrected frontend tree: shell/, views/, hooks/, components/ui/
- Updated routing section (React Router v6, four views)
- Fixed backend tree (added `dealer_risk.py` router)
- Retained Flash Alpha field-name difference table
- Retained key decisions section

### 4. CONTRIBUTING.md (new)

Standalone contribution guide:
- Setup instructions
- PR process (branch → test → PR against master)
- Backend and frontend guidelines
- Security rules (no secrets)
- License acknowledgement for contributors

### 5. backend/.env.example (new)

Template for `backend/.env`:
```
GEX_ADAPTER=seed
FLASH_ALPHA_API_KEY=your_api_key_here
CACHE_TTL_SECONDS=30
SNAPSHOT_INTERVAL_SECONDS=60
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### 6. .gitignore (update)

Added exclusions for Claude Code local settings:
```
.claude/settings.json
.claude/settings.local.json
```

---

## Verification

- [ ] `backend/.env.example` is tracked in git; `backend/.env` is not
- [ ] `LICENSE` is present at repo root
- [ ] `README.md` Quick Start works from a fresh clone with default seed adapter
- [ ] `CLAUDE.md` file tree matches actual files on disk
- [ ] `.claude/settings.json` and `.claude/settings.local.json` are gitignored
- [ ] No secrets or personal data in any tracked file (`git grep -i "api_key\|password\|secret"`)
