# title-renaming: rename boards, columns and cards

On the board screen, the titles of the board, its columns and its cards
can be edited at any time, not only right after creation.

## Boards UI

The introduction becomes:

A user lists their boards and opens one; boards, columns and cards are
created with an empty title, which is set right after creation and can
be changed later.

The section "Creating" is replaced by:

## Editing a title

- On the board screen, clicking the title of the board, a column or a
  card replaces it with a focused text input holding that title.
- R3 (modified): After a board, column or card is created, its title is
  shown as a focused, empty text input. Enter, or leaving the input,
  records the title, even empty, and the input is replaced by the title
  as text. The same holds for an input opened by clicking a title.
- R4: Escape leaves the input without recording: the title shown is the
  one before editing, and no request is sent.
- An empty title is shown as "(Untitled)".
