# rs-axum: a partial Rust backend

A second backend, `rs_axum`, in Rust with Axum, implementing only the
health check.

## Technical

### Repository

New, after "Every implementation provides a `Makefile` with the targets
`setup`, `run` (honouring `PORT`) and `check` (lint, format check, unit
tests).":

- A partial implementation's `Makefile` also has a `scope` target,
  printing the names of its scope. A name selects the shared tests in
  `tests/api/test_<name>.py` and `tests/e2e/tests/<name>.spec.ts`.

### Implementations

New entry:

- `rs_axum`: partial, its scope is the health check. Rust (stable,
  edition 2024), Axum on Tokio, serde, cargo, rustfmt, Clippy.
  - Response bodies are serde-serialized structs, never JSON values
    built by hand.
  - Unit tests run with `cargo test`, calling the router in-process
    through tower's `ServiceExt::oneshot`, without opening a port.

### Tests and quality

Replaces "An implementation is complete when it passes both shared
suites.":

- An implementation is complete when it passes both shared suites. A
  partial implementation has a scope, given in its entry under
  Implementations; for it, `make check` runs only the shared tests of
  that scope, in both suites.
