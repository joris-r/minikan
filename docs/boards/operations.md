# Operations

## General

A board, column or card, alone, reads
`{"id": "01a15a40-c3bc-7392-9c37-5876fc850924", "title": "Roadmap"}`.

- [unknown] An id, in the path or in `columnId`, of no board, column or
  card: refused, 404, `Not Found`.
- [owner] A board of another user, and its columns and cards: refused
  as /boards/operations/general/unknown.

## List boards

HTTP: `GET /api/boards`.

- [result] Answers 200 with the boards of the requesting user only.

## Add board

HTTP: `POST /api/boards`.

- [added] A new board of the requesting user is stored, without
  columns; answers 201 with it.

## Show board

HTTP: `GET /api/boards/<id>`.

- [result] Answers 200 with the board, its columns in order, each with
  its cards in order:
  `{"id": "…", "title": "Roadmap", "columns": [{"id": "…", "title":
  "To do", "cards": [{"id": "…", "title": "Write the spec"}]}]}`.

## Add column

HTTP: `POST /api/boards/<id>/columns`.

- [added] A new column is stored in the board, last, without cards;
  answers 201 with it.

## Add card

HTTP: `POST /api/columns/<id>/cards`.

- [added] A new card is stored in the column, last; answers 201 with
  it.

## Rename

HTTP: `PATCH /api/boards/<id>`, `PATCH /api/columns/<id>` or
`PATCH /api/cards/<id>` with `{"title": "Doing"}`.

- [renamed] Title of at most 100 characters: the board, column or card
  has that title; answers 200 with it.
- [long] Title longer than 100 characters: refused, 400, as
  /operations/general/malformed.

## Delete

HTTP: `DELETE /api/boards/<id>`, `DELETE /api/columns/<id>` or
`DELETE /api/cards/<id>`.

- [deleted] The board, column or card is no longer stored; answers 204.
- [cascade] Deleting a board deletes its columns and their cards;
  deleting a column deletes its cards.

## Move column

HTTP: `POST /api/columns/<id>/move` with `{"position": 1}`, where
`position` denotes an integer: `1.5`, `true` and `null` are not.

- [moved] Position from 1 to N, N the number of columns of its board:
  - the column is at that position in its board;
  - the other columns keep their relative order;
  - answers 204.
- [clamped] Position below 1: as 1; above N: as N.

## Move card

HTTP: `POST /api/cards/<id>/move` with
`{"columnId": "01a15a40-c3bc-7392-9c37-587a01327a69", "position": 2}`,
where `position` denotes an integer: `1.5`, `true` and `null` are not.

- [moved] A column of the requesting user, in any of their boards, and
  a position from 1 to N, N the number of cards of that column, the
  moved card included:
  - the card is at that position in that column;
  - the other cards of its former column, and of that column, keep
    their relative order;
  - answers 204.
- [clamped] Position below 1: as 1; above N: as N.
