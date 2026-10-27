# real-auth: log in with a password, stay logged in with a session cookie

Users log in with their name and password; the backend keeps a session,
carried by an HttpOnly cookie, instead of trusting a user name sent as
a Bearer token. `rs_axum` is frozen at the API before this change.

## Data model

Replaces the User entity:

- User
  - id
  - name: non-empty, unique
  - password
  - Users named `demo` and `other` always exist, with the passwords
    `demo-password` and `other-password`; there is no way to create
    users.

New:

- Session
  - token
  - belongs to one User
  - expiry
- A user may have several sessions at once.

## Behavior

New pages in `spec/main/`: `auth-api.md` and `auth-ui.md`.

### Auth API

#### POST /api/login

```http
POST /api/login
Content-Type: application/json

{"name": "demo", "password": "demo-password"}
```

```http
HTTP/1.1 204 No Content
Set-Cookie: session=Xq2v…; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

- Needs no session.
- R12: An unknown name and a wrong password get the same answer:
  401, `{"error": "Invalid name or password"}`, and no cookie.

#### POST /api/logout

```http
POST /api/logout
Cookie: session=Xq2v…
```

```http
HTTP/1.1 204 No Content
Set-Cookie: session=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

- R13: After logout, that session's token gets 401; the user's other
  sessions still work.

#### GET /api/session

The user of the current session:

```http
GET /api/session
Cookie: session=Xq2v…
```

```http
HTTP/1.1 200 OK

{"name": "demo"}
```

#### Errors

- 400: the body is not JSON, or `name` or `password` is missing or not
  a string.

### Auth UI

#### Login screen, `/login`

```
Log in
  Name      [          ]
  Password  [          ]
            [Log in]
```

- "Log in" with a valid name and password goes to the boards screen.
- Otherwise a message with the ARIA role `alert` reads "Invalid name or
  password.", and the password field is emptied.

#### Header bar

On the boards screen and the board screen, above their content:

```
Minikan                        demo  [Log out]
```

- "Minikan" is a link to the boards screen.
- Then the name of the logged-in user.
- "Log out" ends the session and goes to the login screen.

#### Other screens

- R14: On the boards and board screens, any API answer 401, including
  on the first load, goes to the login screen, with no banner. This
  replaces R11 for that status.
- The health screen needs no session.

### Boards API

- The requests of the examples carry `Cookie: session=<token>` instead
  of `Authorization: Bearer demo`.

## Technical

### API

Replaces the "Identity", "The frontends act as the user `demo`" and
"401" items:

- Identity: every request other than the health check and the login
  carries the cookie `session`, set by the login.
- R15: 401: the cookie `session` is missing, or names no session or an
  expired one (expired session not testable). An `Authorization`
  header is ignored.
- A session expires 7 days after login.
- Session tokens are 32 bytes from a cryptographically secure random
  generator. The storage keeps only their SHA-256 hash.
- Passwords are stored as Argon2id hashes.
- A login with an unknown name still computes an Argon2id hash.

### Repository

New:

- A frozen implementation is no longer checked by the shared suites:
  for it, the root `make check` runs only its own `check` target. Its
  `Makefile` has a `frozen` target.

### Implementations

- `py_litestar`: passwords are hashed with `argon2-cffi`.
- `rs_axum` is frozen: it implements the API as it was before
  `real-auth`.
- `ts_vue`: requests no longer set an `Authorization` header; the
  browser sends the cookie.
