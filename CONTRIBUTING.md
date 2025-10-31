# Contributing Guide

## Required Tooling
- **Node.js:** 20.15 LTS (use `nvm use 20` if you have Node Version Manager installed).
- **Package manager:** pnpm 8 (declared in `package.json`). Install via `corepack enable` and `corepack prepare pnpm@8 --activate`.
- **Global dependencies:** none. All tooling runs via `pnpm` scripts.

Verify your setup:
```bash
node --version
pnpm --version
```

## Install Dependencies
```bash
pnpm install
```

This command also installs git hooks through `simple-git-hooks`.

## Useful Scripts
- `pnpm dev`: run the Vite dev server at http://localhost:5173.
- `pnpm build`: create a production build.
- `pnpm preview`: preview the production build.
- `pnpm format`: format source files with Prettier (runs on every commit).
- `pnpm typecheck`: run TypeScript in no-emit mode.
- `pnpm msasl:prep100`: placeholder pipeline that will eventually filter, download, trim, and emit labels for MS-ASL.
- `pnpm practice:all`: run whitelist validation, generate packs, and check dataset coverage.

## Pre-commit Hooks
`simple-git-hooks` enforces `pnpm format` before each commit. If you add additional checks (linting, tests), append them to `simple-git-hooks.pre-commit` in `package.json`.

## Project Structure Highlights
- `src/`: React + Tailwind application.
- `adapters/` and `scripts/`: TypeScript tooling for dataset prep.
- `practice/`: static vocab configuration consumed by both pipeline and app.
- `data/processed/msasl/labels.jsonl`: sample schema for generated labels (small, safe to commit).

Refer to the PRDs in `PRD/` for detailed product and data requirements.
