# Boards UI

A user lists their boards and opens one; boards, columns and cards are
created with an empty title, which is set right after creation.

## Boards screen, `/`

- Lists the user's boards by title; each opens its board screen.
- An icon button labelled "Add board" creates a board.

## Board screen, `/boards/{id}`

- Shows the board's title, then its columns side by side, each with its
  cards stacked (layout not testable).
- An icon button labelled "Add column" creates a column in the board.
- In each column, an icon button labelled "Add card" creates a card in
  that column.

## Creating

- R3: After a board, column or card is created, its title is shown as a
  focused, empty text input. Enter, or leaving the input, records the
  title, even empty, and the input is replaced by the title as text.
- An empty title is shown as "(Untitled)".
