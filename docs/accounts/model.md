# Model

## User

- `id: /model/id`.
- `name: string`.
  - [nonempty] Not empty (not testable).
  - [unique] No two users share a name (not testable).
- `password: string`.

## Session

A logged-in client of a user.

- `token: string`, carried by the cookie `session`.
  - [unique] No two sessions share a token (not testable).
- `user: /accounts/model/user`.
- `expiry: time`, the instant it ends.
- [several] A user may have several sessions at once.
