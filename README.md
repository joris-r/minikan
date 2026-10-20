# minikan

A small Kanban web service, used as a learning project: one shared
functional specification and API, implemented in several backend and
frontend technologies. Any frontend works with any backend. It is also
a test bed for the Dev43 process (see `CLAUDE.md` and `spec/`).

## Implementations

- Backends: `backends/py_litestar` (Python, Litestar, SQLite)
- Frontends: `frontends/ts_vue` (TypeScript, Vue)

## Requirements

uv, Node.js 24 and GNU Make.

## Running

```sh
make setup                  # install dependencies
make backend                # API on http://localhost:8000
make frontend               # web app on http://localhost:5173
make check                  # every check and test suite
```

Pick a pair with `BACKEND=<dir> FRONTEND=<dir>`, e.g.
`make check BACKEND=py_litestar FRONTEND=ts_vue`.
