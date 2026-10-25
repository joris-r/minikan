# Backlog

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
- Frontend ts_vue: failed API requests are unhandled (a reload aborting a title PATCH logs a Vue warning), and moves update the screen before their request while other changes wait for it; one policy for both. The e2e suite should fail on browser console errors and warnings.
- Frontend ts_vue: the board screen's move logic (drag and drop, menu, dialog) would move to a composable, shrinking BoardView.
- Frontend ts_vue: the Actions menu declares `role="menu"` but lacks the WAI-ARIA menu button keyboard pattern (arrow keys, focus into the menu on open).
- Tests: property-based tests (Hypothesis) would check rules such as R2 as invariants over generated sequences of API calls.
- Backend rs_axum: widen its scope beyond the health check, starting with users and boards; first choose its storage library (e.g. SQLx or SeaORM).
