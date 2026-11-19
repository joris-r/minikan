# Model

## Id

Identifies a user, board, column or card: a string.

- [uuidv7] A UUIDv7 in its text form, assigned by the backend.
- [unique] No two users, boards, columns or cards share an id (not
  testable).

## State

Everything the backend stores.

- `users: set of /accounts/model/user`.
- `sessions: set of /accounts/model/session`.
- `boards: set of /boards/model/board`.
- `columns: set of /boards/model/column`.
- `cards: set of /boards/model/card`.
- [references] The user of each session and board, the board of each
  column and the column of each card are in the state.
