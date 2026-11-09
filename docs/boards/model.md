# Model

## Title

The name of a board, column or card.

- [length] A string of 0 to 100 characters.
- [fresh] Empty at creation.

## Board

- `id: /model/id`.
- `title: /boards/model/title`.
- `user: /accounts/model/user`, its owner.
- Boards have no specified order.

## Column

- `id: /model/id`.
- `title: /boards/model/title`.
- `board: /boards/model/board`.
- `position: integer`, its place in its board, 1 first.
  - [contiguous] In each board, positions run from 1 to the number of
    its columns.

## Card

- `id: /model/id`.
- `title: /boards/model/title`.
- `column: /boards/model/column`.
- `position: integer`, its place in its column, 1 first.
  - [contiguous] In each column, positions run from 1 to the number of
    its cards.
