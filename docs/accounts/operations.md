# Operations

## General

Every operation other than /operations/health-check and Log in has the
input `session: optional string`, the cookie `session`, and its cases:

1. [first] A request refused by /operations/general/malformed: refused
   as it, whatever its cookie.
2. [session] The cookie names a session not expired: its user is the
   requesting user, and the operation's cases apply.
3. [unauthenticated] The cookie missing, or naming no session: refused,
   401, `Unauthorized`.
4. [expired] The cookie naming an expired session: refused, 401,
   `Unauthorized` (not testable).

- [header] An `Authorization` header is ignored.

## Log in

HTTP: `POST /api/login` with `{"name": "demo", "password": "demo-password"}`.

Inputs:
- `name: string`
- `password: string`

Cases:
- [accepted] Name of a user and their password:
  - a new session is stored: a token no session has, that user, an
    expiry 7 days after the login;
  - answers 204, setting the cookie
    `session=<token>; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`.
- [rejected] Name of no user, or a wrong password: refused, 401,
  `Invalid name or password`, setting no cookie.

## Log out

HTTP: `POST /api/logout`.

Inputs: none.

Cases:
- [ended] The session is deleted:
  - its token then gets /accounts/operations/general/unauthenticated;
  - the user's other sessions are kept;
  - answers 204, setting the cookie
    `session=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0`.

## Show session

HTTP: `GET /api/session`.

Inputs: none.

Cases:
- [result] Answers 200 with the name of the session's user:
  `{"name": "demo"}`.
