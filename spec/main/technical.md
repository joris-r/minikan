# Technical

## Repository

- A monorepo:
  - `backends/<lang>_<framework>/`: one backend per directory, e.g. `py_litestar`.
  - `frontends/<lang>_<framework>/`: one frontend per directory, e.g. `ts_vue`.
  - `tests/api/`: the API conformance suite.
  - `tests/e2e/`: the end-to-end suite.
- Every implementation provides a `Makefile` with the targets `setup`,
  `run` (honouring `PORT`) and `check` (lint, format check, unit tests).
- Every backend's `run` target accepts `TEMP_STORAGE=1`: the backend
  starts with storage holding only the seeded users, and discards it
  when it stops. The root runner uses it for the shared suites.
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

- Every frontend has a health screen, `/health`, showing the answer of
  the health check as `API: ok`. The other screens do not show it
  (not testable).
- Identity: every other request carries `Authorization: Bearer <token>`.
  For now the token is the user's name, and it is not verified.
- The frontends act as the user `demo`.
- Error responses are JSON: `{"error": "<message>"}`.
- 401: the `Authorization` header is missing or names no existing user.
- Frontends call the API on their own origin under `/api`; in
  development their dev server proxies it to the backend at
  `MINIKAN_API_URL`.

## Storage

- Each backend owns its storage and schema; data is not shared between
  backends.

## Implementations

- `py_litestar`: Python 3.14, Litestar, SQLite, uv, ruff, pytest.
  Database access through SQLAlchemy (Advanced Alchemy), with
  aiosqlite. The schema is created at startup from the models, without
  migrations.
  - Database access goes through one Advanced Alchemy service per
    model (`SQLAlchemyAsyncRepositoryService`, with its repository),
    injected with `create_service_provider`.
  - Routes are grouped in one Litestar `Controller` per resource.
  - Request and response bodies are `msgspec.Struct` types declared in
    the controllers' modules; handlers declare them as their parameter
    and return types, never dicts.
  - Bodies are decoded in Litestar's lax mode: a position may also be
    given as a string or a float holding an integer (`"1"`, `1.0`,
    `"1.0"`).
  - The order of columns and cards is stored as an integer position,
    kept by SQLAlchemy's `ordering_list` on `Board.columns` and
    `Column.cards`.
  - Modules, by domain:

    ```
    src/minikan/
      app.py        # assembles the app: plugins, routers, error handlers, startup
      db.py         # database configuration, temporary storage, schema and seeded users
      models.py
      accounts/     # User: service, current user dependency
      boards/       # Board, Column, Card: services, controllers
    ```
- `ts_vue`: TypeScript, Vue 3, Vite, npm, ESLint with oxlint, Prettier,
  Vitest, Vue Router.
  - Dialogs are HTML `<dialog>` elements, without a library.
  - Drag and drop uses the native HTML drag and drop API, without a
    library.

## Tests and quality

- The shared suites check the functional specification and the API,
  against any implementation:
  - `tests/api`: Python, pytest and httpx, against the backend at
    `MINIKAN_API_URL`.
  - `tests/e2e`: TypeScript and Playwright (Chromium), against a
    frontend wired to a backend.
- The shared suites never assume an empty storage: each test checks
  only what it created. The e2e suite runs its tests in parallel.
- The Tests phase writes the shared suites; an implementation's own
  unit tests are written during Implementation.
- An implementation is complete when it passes both shared suites.
- Each implementation has its own unit tests for its internals, in the
  idiom of its stack.
- `make check` passes before every commit.
