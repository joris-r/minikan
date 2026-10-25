# rs-axum-complete: the Rust backend implements the whole API

`rs_axum` implements the Boards API on its own storage and becomes a
complete implementation.

## Technical

### Implementations

Replaces the `rs_axum` entry:

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
