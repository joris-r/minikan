# Boards UI

A user lists their boards and opens one; boards, columns and cards are
created with an empty title, which is set right after creation and can
be changed later, and they can be deleted.

## Boards screen, `/`

- Lists the user's boards by title; each opens its board screen.
- An icon button labelled "Add board" creates a board.

## Board screen, `/boards/{id}`

- Shows the board's title, then its columns in order, left to right,
  each with its cards in order, top to bottom (layout not testable).
- An icon button labelled "Add column" creates a column in the board.
- In each column, an icon button labelled "Add card" creates a card in
  that column.

## Drag and drop

- A column or a card is moved by dragging it.
- A column dropped onto another column, or a card dropped onto another
  card, takes that element's position.
- A card dropped onto a column, outside its cards, is placed last in
  that column.
- The new order is shown at once and kept after a reload.

## Actions menu

- Each board on the boards screen, and the board, each column and each
  card on the board screen, is an article (ARIA role) named by its
  title.
- Each of these articles has, right after its title, an icon button
  labelled "Actions", which opens a menu. Its items are, in order:
  - on a column: "Move left", unless it is first; "Move right", unless
    it is last; "Delete";
  - on a card: "Move up", unless it is first in its column; "Move
    down", unless it is last; "Move to column"; "Delete";
  - on a board: "Delete".
- "Move left" and "Move right" swap a column with its neighbour on that
  side; "Move up" and "Move down" do the same for a card within its
  column.
- "Move to column" opens the move dialog.
- As with drag and drop, the new order is shown at once and kept after
  a reload.
- R9: After a move from the menu or the move dialog, the focus is on:
  - for a column, or a card moved within its column, its Actions
    button;
  - for a card moved to another column, the Actions button of the card
    now at its former position in the source column, or of the previous
    card if it was last, or the "Add card" button of the source column
    if it is left empty.
- R6: Deleting a board or column that holds a column or card first
  opens a modal dialog with the buttons "Delete" and "Cancel"; only
  "Delete" deletes it. An empty board or column, and a card, are
  deleted at once. (modal not testable)
- A deleted item disappears from the screen. Deleting the board shown
  on the board screen goes to the boards screen.

## Move dialog

A modal dialog named "Move card", for a card "Fix login" in "To do":

```
Move card
  To do (current)   [Top] [Bottom]
  Doing             [Top] [Bottom]
  Done              [Top] [Bottom]
                          [Cancel]
```

- Lists every column of the card's board, in order, each by its title
  followed by a "Top" and a "Bottom" button. The buttons of all rows
  are aligned, whatever the length of the titles (layout not testable).
- The card's own column is marked "(current)" after its title.
- "Top" moves the card first in that column, "Bottom" last, and closes
  the dialog. Their accessible names are "Move to top of <column>" and
  "Move to bottom of <column>", the column named by its title.
- "Cancel", or Escape, closes the dialog without moving the card.

## Title input

- On the board screen, clicking the title of the board, a column or a
  card replaces it with a focused text input holding that title.
- R3: After a board, column or card is created, its title is shown as a
  focused, empty text input. Enter, or leaving the input, records the
  title, even empty, and the input is replaced by the title as text.
  The same holds for an input opened by clicking a title.
- R4: Escape leaves the input without recording: the title shown is the
  one before editing, and no request is sent.
- An empty title is shown as "(Untitled)".

## Changes and failures

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
