# Model

## User

- `id: /model/id`.
- `name: string`.
  - [nonempty] Not empty.
  - [unique] No two users share a name.
- `password: string`.
- [seeded] The users `demo` and `other` always exist, with the
  passwords `demo-password` and `other-password`.

## Session

A logged-in client of a user.

- `token: string`, carried by the cookie `session`.
- `user: /accounts/model/user`.
- `expiry: datetime`.
  - [lifetime] 7 days after the login that created the session.
- [several] A user may have several sessions at once.
