# Operations

## General

A board, column or card, alone, reads
`{"id": "01a15a40-c3bc-7392-9c37-5876fc850924", "title": "Roadmap"}`.

The inputs `id` and `columnId` name a board, column or card, as the
operation says.

Once /accounts/operations/general/session and
/operations/general/malformed accept the request:

- [unknown] An `id` or `columnId` naming no board, column or card of
  that kind: refused, 404, `Not Found`.
- [owner] A board of another user, and its columns and cards: refused
  as /boards/operations/general/unknown.
- [clamped] In a move, a position below 1 is taken as 1, and one above
  N as N, N being the count its cases name; then its [moved] case
  applies with that position.

## List boards

HTTP: `GET /api/boards`.

Inputs: none.

Cases:
- [result] Answers 200 with the boards of the requesting user only, in
  an order left free.

## Add board

HTTP: `POST /api/boards`.

Inputs: none.

Cases:
- [added] A new board is stored: an id nothing has, an empty title, the
  requesting user as its owner, without columns; answers 201 with it.

## Show board

HTTP: `GET /api/boards/<id>`.

Inputs:
- `id: string`, the board.

Cases:
- [result] Answers 200 with the board, its columns in order, each with
  its cards in order:
  `{"id": "…", "title": "Roadmap", "columns": [{"id": "…", "title":
  "To do", "cards": [{"id": "…", "title": "Write the spec"}]}]}`.

## Add column

HTTP: `POST /api/boards/<id>/columns`.

Inputs:
- `id: string`, the board.

Cases:
- [added] A new column is stored: an id nothing has, an empty title, in
  the board, last, without cards; answers 201 with it.

## Add card

HTTP: `POST /api/columns/<id>/cards`.

Inputs:
- `id: string`, the column.

Cases:
- [added] A new card is stored: an id nothing has, an empty title, in
  the column, last; answers 201 with it.

## Rename

HTTP: `PATCH /api/boards/<id>`, `PATCH /api/columns/<id>` or
`PATCH /api/cards/<id>` with `{"title": "Doing"}`.

Inputs:
- `id: string`, the board, column or card, as the route says.
- `title: /boards/model/title`

Cases:
- [renamed] The board, column or card has that title; answers 200 with
  it.

## Delete

HTTP: `DELETE /api/boards/<id>`, `DELETE /api/columns/<id>` or
`DELETE /api/cards/<id>`.

Inputs:
- `id: string`, the board, column or card, as the route says.

Cases:
- [deleted] The board, column or card is no longer stored; answers 204.

Then:
- [cascade] After [deleted]: deleting a board deletes its columns and
  their cards; deleting a column deletes its cards.
- [renumbered] After [deleted], for a column or card: the columns of
  its board, or the cards of its column, that came after it move up
  one position (not testable).

## Move column

HTTP: `POST /api/columns/<id>/move` with `{"position": 1}`.

Inputs:
- `id: string`, the column.
- `position: integer`, a value denoting one: `1.5`, `true` and `null`
  do not.

Cases, N the number of columns of its board:
- [moved] Position from 1 to N:
  - the column is at that position in its board;
  - the other columns keep their relative order;
  - answers 204.
- [clamped] /boards/operations/general/clamped applies.

## Move card

HTTP: `POST /api/cards/<id>/move` with
`{"columnId": "01a15a40-c3bc-7392-9c37-587a01327a69", "position": 2}`.

Inputs:
- `id: string`, the card.
- `columnId: string`, the column it goes to, in any board of the
  requesting user.
- `position: integer`, a value denoting one: `1.5`, `true` and `null`
  do not.

Cases, N the number of cards of that column, the moved card included:
- [moved] Position from 1 to N:
  - the card is at that position in that column;
  - the other cards of its former column, and of that column, keep
    their relative order;
  - answers 204.
- [clamped] /boards/operations/general/clamped applies.
