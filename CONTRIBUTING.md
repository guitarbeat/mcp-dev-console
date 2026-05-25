# Contributing to MCP Dev Console

Thanks for your interest! This guide covers the monorepo structure and development workflow.

## Repository Layout

| Path | What |
|------|------|
| `apps/web/` | React UI (Tasklet instant app) |
| `packages/mcp-client/` | MCP protocol client library |
| `.github/` | CI workflows + issue/PR templates |

## Development Setup

```bash
git clone https://github.com/guitarbeat/mcp-dev-console.git
cd mcp-dev-console
cp .env.example .env
```

## Where to Make Changes

| Change | Location |
|--------|----------|
| MCP protocol feature | `packages/mcp-client/src/` |
| UI component | `apps/web/components/` |
| Tool presets | `apps/web/utils/presets.ts` |
| Protocol types | `packages/mcp-client/src/types.ts` |
| UI-only types | `apps/web/types.ts` |

## Type Checking

```bash
cd packages/mcp-client && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

## Formatting

```bash
npx prettier --check '**/*.{ts,tsx,json,md,css}'   # check
npx prettier --write '**/*.{ts,tsx,json,md,css}'    # fix
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(web): add dark mode toggle
fix(mcp-client): handle SSE reconnection
docs: update README architecture diagram
chore: update CI node version
```

Scopes: `web`, `mcp-client`, `ci`, or omit for cross-cutting changes.

## Pull Request Checklist

- [ ] Type checks pass in both packages
- [ ] Code is formatted (`prettier --check`)
- [ ] New exports added to barrel files (`index.ts`)
- [ ] README updated if public API changed
- [ ] Commits follow conventional format

## Architecture Notes

- **Monorepo** — protocol client and UI are co-located but independently importable
- **Relative imports** — packages reference each other via relative paths
- **No bundler config** — Tasklet's instant app runtime handles bundling
- **curl transport** — MCP client uses curl via Tasklet bridge (sandboxed environment)
