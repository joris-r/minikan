# menu-moves: move columns and cards from the Actions menu

The Actions menu of columns and cards gains move items, so that they
can be moved from the keyboard, and a card sent to the top or bottom of
any column of its board.

## Boards UI

### Actions menu

Replaces "Its only item is "Delete"":

- Each of these articles has, right after its title, an icon button
  labelled "Actions", which opens a menu. Its items are, in order:
  - on a column: "Move left", unless it is first; "Move right", unless
    it is last; "Delete";
  - on a card: "Move up", unless it is first in its column; "Move
    down", unless it is last; "Move to column"; "Delete";
  - on a board: "Delete".

Added:

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

New section, after "Actions menu":

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
