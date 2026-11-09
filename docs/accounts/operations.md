# Operations

## General

- [session] Every operation other than /operations/health-check and
  Log in needs a session: the cookie `session` names a session not
  expired, whose user is the requesting user.
- [unauthenticated] The cookie `session` missing, or naming no session:
  refused, 401, `Unauthorized`.
- [expired] The cookie `session` naming an expired session: refused,
  401 (not testable).
- [header] An `Authorization` header is ignored.

## Log in

HTTP: `POST /api/login` with `{"name": "demo", "password": "demo-password"}`.

- [accepted] Name of a user and their password:
  - a new session of that user is stored;
  - answers 204, setting the cookie
    `session=<token>; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`.
- [rejected] Name of no user, or a wrong password: refused, 401,
  `Invalid name or password`, setting no cookie.

## Log out

HTTP: `POST /api/logout`.

- [ended] The session is deleted:
  - its token then gets /accounts/operations/general/unauthenticated;
  - the user's other sessions are kept;
  - answers 204, setting the cookie
    `session=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`.

## Show session

HTTP: `GET /api/session`.

- [result] Answers 200 with the name of the session's user:
  `{"name": "demo"}`.
