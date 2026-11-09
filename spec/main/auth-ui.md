# Auth UI

## Login screen, `/login`

```
Log in
  Name      [          ]
  Password  [          ]
            [Log in]
```

- "Log in" with a valid name and password goes to the boards screen.
- Otherwise a message with the ARIA role `alert` reads "Invalid name or
  password.", and the password field is emptied.
- When the login request fails other than with 401, the message reads
  "The login could not be sent; try again."

## Header bar

On the boards screen and the board screen, above their content:

```
Minikan                        demo  [Log out]
```

- "Minikan" is a link to the boards screen.
- Then the name of the logged-in user.
- "Log out" ends the session and goes to the login screen.
- When the logout request fails other than with 401, the screen stays,
  and the banner reads "The logout failed; the session is still open."

## Other screens

- R14: On the boards and board screens, any API answer 401, including
  on the first load, goes to the login screen, with no banner.
- The health screen needs no session.
