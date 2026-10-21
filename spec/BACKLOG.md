# Backlog

Strategy: grow features on the `py_litestar` / `ts_vue` pair up to a
representative kanban core, then add other backends and frontends.

- Ordering and moving of columns and cards.
- titles renaming
- Deletion of boards, columns and cards.
- Real authentication, replacing the user name as token.
- Sharing boards between users.
- Real-time updates between clients viewing the same board (needs sharing).
- Card description and tags, with filtering by tag.
- Import and export of a board in a todo.txt-like format, with a section per column.
- Backend py_litestar: Litestar DTOs (`SQLAlchemyDTO`) would replace the hand-built response dicts and `TitleIn`.
- Backend py_litestar: services scoped to the current user (provider `statement`) would filter every query by owner, instead of each handler calling `get_owned`.
- Tests: property-based tests (Hypothesis) would check rules such as R2 as invariants over generated sequences of API calls.
