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
