# Test suite

This project uses [Vitest](https://vitest.dev/) for TypeScript unit and integration tests.

## Layout

| Path | Purpose |
|------|---------|
| `tests/unit/` | Fast, isolated tests (pure functions, helpers). |
| `tests/integration/` | Tests that cross module boundaries or I/O (still no live network by default). |
| `tests/examples/` | Demos: `tdd-counter/` (red-green-refactor), `patterns/` (`strings.example.test.ts` for timers/mocks). |
| `tests/fixtures/` | Shared static inputs (JSON, snapshots). |

## Scripts

```bash
npm test              # run once
npm run test:watch    # watch mode (TDD)
npm run test:coverage # coverage for lib/
```

## Test-Driven Development (TDD)

1. **Red** — Write a failing test that describes the behavior you want.
2. **Green** — Write the smallest amount of production code to pass the test.
3. **Refactor** — Improve names and structure while keeping tests green.

Repeat for the next behavior. For this app, prefer adding tests next to new logic under `lib/` before wiring routes or UI.

## Conventions

- Name files `*.test.ts` (or `*.test.tsx` for React components).
- Prefer importing from `vitest`: `import { describe, it, expect, vi } from "vitest"`.
- Do not call live LLM APIs in automated tests; mock at the network or provider boundary when needed.
