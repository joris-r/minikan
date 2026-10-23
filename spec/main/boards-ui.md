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
  labelled "Actions", which opens a menu. Its only item is "Delete".
- R6: Deleting a board or column that holds a column or card first
  opens a modal dialog with the buttons "Delete" and "Cancel"; only
  "Delete" deletes it. An empty board or column, and a card, are
  deleted at once. (modal not testable)
- A deleted item disappears from the screen. Deleting the board shown
  on the board screen goes to the boards screen.

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
