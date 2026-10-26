# vue-request-policy: changes and failed requests in the UI

Changes to existing boards, columns and cards are shown before the API
answers; a failed request shows a message and the screen reloads what
is stored. The e2e suite fails on browser console errors and warnings.

## Boards UI

### Changes and failures

New section, after Title input:

- R10: Renaming, moving or deleting a board, column or card is shown at
  once, before the API answers. Creating one is shown once the API has
  answered.
- R11: When the request of a change fails, the screen then shown
  reloads its data from the API and shows a banner, with the ARIA role
  `alert`:

  ```
  The change could not be saved; the screen was reloaded.   [Close]
  ```

- When a screen's first load fails, the banner reads "The board could
  not be loaded." on the board screen, "The boards could not be
  loaded." on the boards screen.
- "Close" removes the banner; so does a later change whose request
  succeeds.

## Technical

### Tests and quality

New item:

- An e2e test fails when its page logs an error or a warning to the
  browser console.
