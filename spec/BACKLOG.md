# Backlog

Strategy: grow features on the `py_litestar` / `ts_vue` pair up to a
representative kanban core, then add other backends and frontends.

- UI: moving columns and cards from the keyboard, as drag and drop is mouse-only.
- UI: a "Move to column" action in a card's menu, for boards with many columns.
- Real authentication, replacing the user name as token.
- Sharing boards between users.
- Real-time updates between clients viewing the same board (needs sharing).
- Card description and tags, with filtering by tag.
- Import and export of a board in a todo.txt-like format, with a section per column.
- Backend py_litestar: services scoped to the current user (provider `statement`) would filter every query by owner, instead of each handler calling `get_owned`.
- Backend py_litestar: concurrent moves in the same list can interleave (no locking); needed before sharing.
- Storage: migrations (Alembic, through Advanced Alchemy), so a schema change reaches an existing database.
- Storage: whether to enforce title length in the database too (a SQLite `CHECK`), not only in the API.
- API contract: a shared OpenAPI file, checked against every backend, would generate the frontends' types.
- Frontend ts_vue: failed API requests are unhandled (a reload aborting a title PATCH logs a Vue warning); the e2e suite should fail on browser console errors and warnings.
- Tests: property-based tests (Hypothesis) would check rules such as R2 as invariants over generated sequences of API calls.
