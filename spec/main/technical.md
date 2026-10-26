# Technical

## Repository

- A monorepo:
  - `backends/<lang>_<framework>/`: one backend per directory, e.g. `py_litestar`.
  - `frontends/<lang>_<framework>/`: one frontend per directory, e.g. `ts_vue`.
  - `tests/api/`: the API conformance suite.
  - `tests/e2e/`: the end-to-end suite.
- Every implementation provides a `Makefile` with the targets `setup`,
  `run` (honouring `PORT`) and `check` (lint, format check, unit tests).
- A partial implementation's `Makefile` also has a `scope` target,
  printing the names of its scope. A name selects the shared tests in
  `tests/api/test_<name>.py` and `tests/e2e/tests/<name>.spec.ts`.
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
- `rs_axum`: Rust (stable, edition 2024), Axum on Tokio, serde, cargo,
  rustfmt, Clippy. SQLite through SQLx, with plain SQL queries. The
  schema is created at startup by a SQL script, without migrations.
  - The database is the file `minikan.db` in the backend's directory;
    with `TEMP_STORAGE=1`, an in-memory database.
  - Request and response bodies are serde structs; rows are read into
    `sqlx::FromRow` structs. Never JSON values built by hand.
  - Bodies are decoded by serde's defaults: a position is a JSON
    integer only.
  - The order of columns and cards is stored as an integer position.
  - Unit tests run with `cargo test`, calling the router in-process
    through tower's `ServiceExt::oneshot`, without opening a port.
  - Modules:

    ```
    src/
      main.rs     # reads PORT and TEMP_STORAGE, starts the server
      lib.rs      # assembles the app: router, shared state
      db.rs       # connection pool, schema and seeded users
      error.rs    # error type and its JSON responses
      auth.rs     # current user extractor
      health.rs
      boards.rs   # Board, Column, Card: bodies, queries, handlers
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
- An e2e test fails when its page logs an error or a warning to the
  browser console.
- The Tests phase writes the shared suites; an implementation's own
  unit tests are written during Implementation.
- An implementation is complete when it passes both shared suites. A
  partial implementation has a scope, given in its entry under
  Implementations; for it, `make check` runs only the shared tests of
  that scope, in both suites.
- Each implementation has its own unit tests for its internals, in the
  idiom of its stack.
- `make check` passes before every commit.
