# Technical

## Repository

- A monorepo:
  - `backends/<lang>_<framework>/`: one backend per directory, e.g. `py_litestar`.
  - `frontends/<lang>_<framework>/`: one frontend per directory, e.g. `ts_vue`.
  - `tests/api/`: the API conformance suite.
  - `tests/e2e/`: the end-to-end suite.
- Every implementation provides a `Makefile` with the targets `setup`,
  `run` (honouring `PORT`) and `check` (lint, format check, unit tests).
- The root `Makefile` runs any pair: `make check BACKEND=<dir> FRONTEND=<dir>`.
- Everything runs locally and natively: no Docker, no remote CI.

## API

- Every pair of backend and frontend is compatible: all backends expose
  the same HTTP API, under `/api`.
- Bodies are JSON. Field names are in camelCase.
- Health check, without authentication:

  ```http
  GET /api/health

  200 OK
  {"status": "ok"}
  ```

- Identity: requests carry `Authorization: Bearer <token>`. For now the
  token is the user's name, and it is not verified.
- Frontends call the API on their own origin under `/api`; in
  development their dev server proxies it to the backend at
  `MINIKAN_API_URL`.

## Storage

- Each backend owns its storage and schema; data is not shared between
  backends.

## Implementations

- `py_litestar`: Python 3.14, Litestar, SQLite, uv, ruff, pytest.
  Database access through SQLAlchemy (Advanced Alchemy).
- `ts_vue`: TypeScript, Vue 3, Vite, npm, ESLint with oxlint, Prettier,
  Vitest.

## Tests and quality

- The shared suites check the functional specification and the API,
  against any implementation:
  - `tests/api`: Python, pytest and httpx, against the backend at
    `MINIKAN_API_URL`.
  - `tests/e2e`: TypeScript and Playwright (Chromium), against a
    frontend wired to a backend.
- An implementation is complete when it passes both shared suites.
- Each implementation has its own unit tests for its internals, in the
  idiom of its stack.
- `make check` passes before every commit.
