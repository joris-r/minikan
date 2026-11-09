# UI

## Header bar

Shows, left to right:
- [home] "Minikan", a link to the Boards screen;
- [user] the name of the logged-in user, then a "Log out" button.

Actions:
- [log-out] "Log out": runs /accounts/operations/log-out.
  - [ended] Accepted: goes to `/login`.
  - [failed] Failed other than with 401: the screen stays, and the
    Banner reads "The logout failed; the session is still open."

## Boards screen

At `/`.

Shows:
- [header] the Header bar, above the rest;
- [boards] the boards of /boards/operations/list-boards, each an Item
  that opens its Board screen;
- [add] an icon button labelled "Add board".
- [load-failed] Its first load failed: the Banner reads "The boards
  could not be loaded."

Actions:
- [add-board] "Add board": runs /boards/operations/add-board.

## Board screen

At `/boards/<id>`.

Shows:
- [header] the Header bar, above the rest;
- [board] the board, an Item, then its columns in order, left to
  right, each an Item, with its cards in order, top to bottom, each an
  Item (layout not testable);
- [add] an icon button labelled "Add column";
- [add-card-button] in each column, an icon button labelled "Add card".
- [load-failed] Its first load failed: the Banner reads "The board
  could not be loaded."

Actions:
- [add-column] "Add column": runs /boards/operations/add-column.
- [add-card] "Add card": runs /boards/operations/add-card in its
  column.

## Item

A board, column or card on a screen.

Shows:
- [article] an element with the ARIA role `article`, named by its
  title;
- [title] its title; an empty title reads "(Untitled)";
- [actions] right after its title, an icon button labelled "Actions".

Actions:
- [open-menu] "Actions": opens the Actions menu.
- [edit] On the Board screen, a click on its title: opens the Title
  input, holding that title.
- [created] Once /boards/operations/add-board,
  /boards/operations/add-column or /boards/operations/add-card has
  answered: the new Item is shown, its title as the Title input,
  empty.

## Actions menu

Shows its items, in order:
- [column] on a column: "Move left", unless it is first; "Move right",
  unless it is last; "Delete";
- [card] on a card: "Move up", unless it is first in its column; "Move
  down", unless it is last; "Move to column"; "Delete";
- [board] on a board: "Delete".

Actions:
- [left-right] "Move left" or "Move right": runs
  /boards/operations/move-column, swapping the column with its
  neighbour on that side.
- [up-down] "Move up" or "Move down": runs /boards/operations/move-card,
  swapping the card with its neighbour on that side, in its column.
- [move-to] "Move to column": opens the Move dialog.
- [delete] "Delete": runs /boards/operations/delete, after the Delete
  dialog for a board or column holding a column or card; at once for
  an empty board or column, and for a card.
  - [gone] The Item is no longer shown.
  - [board-shown] Deleting the board of the Board screen: goes to the
    Boards screen.
- [focus] After a move from this menu or the Move dialog, the focus is
  on:
  - [focus-same] for a column, or a card moved within its column, its
    "Actions" button;
  - [focus-other] for a card moved to another column, the "Actions"
    button of the card now at its former position in its former
    column, or of the previous card if it was last, or the "Add card"
    button of that column if it is left empty.

## Delete dialog

A modal dialog (modal not testable).

Shows:
- [buttons] a "Delete" and a "Cancel" button.

Actions:
- [delete] "Delete": deletes.
- [cancel] "Cancel": closes the dialog; nothing is deleted.
- [only] Nothing but "Delete" deletes.

## Move dialog

A modal dialog named "Move card", for a card.

Shows:
- [rows] every column of the card's board, in order, each its title,
  then a "Top" and a "Bottom" button, named "Move to top of <column>"
  and "Move to bottom of <column>"; the buttons of all rows are
  aligned, whatever the length of the titles (layout not testable);
- [current] "(current)" after the title of the card's column;
- [cancel] a "Cancel" button.

Actions:
- [top] "Top": runs /boards/operations/move-card to position 1 in that
  column, and closes the dialog.
- [bottom] "Bottom": the same, last in that column.
- [close] "Cancel", or Escape: closes the dialog; the card is not
  moved.

## Drag and drop

Actions, on the Board screen:
- [onto] A column dragged onto another column, or a card onto another
  card: runs /boards/operations/move-column or
  /boards/operations/move-card, to that element's position.
- [column-end] A card dragged onto a column, outside its cards: runs
  /boards/operations/move-card, last in that column.

## Title input

A focused text input, in place of an Item's title.

Actions:
- [record] Enter, or focus leaving the input: runs
  /boards/operations/rename with its text, even empty; the input is
  replaced by the title.
- [escape] Escape: the input is replaced by the title before editing;
  no request is sent.

## Changes

- [shown] A rename, move or delete is shown at once, before the API
  answers; a creation, once it has answered.
- [failed] Its request failed other than with 401: the screen then
  shown reloads its data from the API, and the Banner reads "The
  change could not be saved; the screen was reloaded."
- [unauthenticated] On the Boards and Board screens, any API answer
  401, the first load included: goes to `/login`, without the Banner.

## Banner

Shows, with the ARIA role `alert`:
- [message] After a failure: its message, then a "Close" button.
  - [closed] "Close" clicked, or a later change whose request succeeds:
    hidden.
