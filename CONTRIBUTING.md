# Contributing to GEX Dashboard

Thank you for your interest in contributing. This document describes how to get involved.

## Before You Start

- Read the [README](README.md) for architecture and setup instructions
- Check open Issues to see if your idea or bug is already tracked
- For significant changes, open an Issue first to discuss the approach

## Development Setup

```bash
git clone https://github.com/your-username/gex-app.git
cd gex-app
cp backend/.env.example backend/.env
./start.sh
```

The seed adapter (default) requires no API key and works immediately.

## Pull Request Process

1. Fork and create a branch from `master`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, keeping commits focused and atomic.

3. Test end-to-end before opening a PR:
   - Hit affected API endpoints with `curl` or `/docs`
   - Open the dashboard in a browser and exercise all affected views
   - Check responsive layout at mobile widths

4. Open a PR against `master` with:
   - A clear description of what changed and why
   - Screenshots for any UI changes
   - Links to any related Issues

## Guidelines

### General

- One concern per PR — don't mix unrelated changes
- Follow existing patterns in the codebase rather than introducing new ones
- No new external runtime dependencies without prior discussion

### Backend

- Use `uv` for dependency management (`uv add <package>`, then commit `pyproject.toml` and `uv.lock`)
- New data source adapters are welcome — implement `GEXDataAdapter` in `backend/adapters/`
- Keep adapter logic in `adapters/`; keep routing logic in `routers/`

### Frontend

- Do not add external UI libraries — extend the existing primitives in `src/components/ui/`
- Mobile-first: test at 375 px wide before marking UI work done
- Keep components focused; split large components before they exceed ~200 lines

### Security

- Never commit API keys, `.env` files, or personal credentials
- Do not log request headers or full API responses that may contain user secrets

## License

By contributing, you agree that your contributions are licensed under the same [Personal Use License](LICENSE) as this project.
