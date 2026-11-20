# UI

## Login screen

At `/login`.

Shows, top to bottom:
- [form] the heading "Log in", a "Name" field, a "Password" field and a
  "Log in" button;
- [message] after a failed login, its message, with the ARIA role
  `alert`.

Actions:
- [log-in] "Log in": runs /accounts/operations/log-in with the fields.
  - [accepted] Accepted: goes to `/`.
  - [rejected] Refused with 401: the message reads "Invalid name or
    password.", and the password field is emptied.
  - [failed] Failed otherwise: the message reads "The login could not
    be sent; try again."

## Header bar

Shows, left to right:
- [home] "Minikan", a link to `/`;
- [user] the name of the user of /accounts/operations/show-session,
  then a "Log out" button;
- [no-name] Show session failed other than with 401: no name, then the
  "Log out" button.

Actions:
- [log-out] "Log out": runs /accounts/operations/log-out.
  - [ended] Accepted: goes to `/login`.
  - [failed] Failed other than with 401: the screen stays, and
    /ui/banner reads "The logout failed; the session is still open."

## Session ended

- [unauthenticated] On a screen showing /accounts/ui/header-bar, any
  API answer 401, the screen's first load included: goes to `/login`,
  without /ui/banner.
