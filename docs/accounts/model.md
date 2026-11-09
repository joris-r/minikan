# Model

## User

- `id: /model/id`.
- `name: string`.
  - [nonempty] Not empty (not testable).
  - [unique] No two users share a name (not testable).
- `password: string`.
- [seeded] The users `demo` and `other` always exist, with the
  passwords `demo-password` and `other-password`.

## Session

A logged-in client of a user.

- `token: string`, carried by the cookie `session`.
- `user: /accounts/model/user`.
- `expiry: datetime`.
  - [lifetime] 7 days after its login (not testable).
- [several] A user may have several sessions at once.
