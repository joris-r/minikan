# ordering: order and move columns and cards

Columns are ordered within their board, cards within their column; the
user moves them by drag and drop, a card possibly to another column.

## Data model

Replaces "The order of boards, columns and cards is not specified":

- The columns of a board, and the cards of a column, are ordered. Their
  positions run from 1 to N, N being the number of elements.
- The order of boards is not specified.
- R7: A new column or card is placed last.

## Boards API

### GET /api/boards/{id}

Unchanged example; `columns` and each `cards` are now in order.

### POST /api/columns/{id}/move

Move a column within its board:

```http
POST /api/columns/01a15a40-c3bc-7392-9c37-587a01327a69/move
Authorization: Bearer demo
Content-Type: application/json

{"position": 1}
```

```http
HTTP/1.1 204 No Content
```

### POST /api/cards/{id}/move

Move a card to a position in a column, its own or any other column of
the same user:

```http
POST /api/cards/01a15a40-c3bc-7392-9c37-587b93cbbd02/move
Authorization: Bearer demo
Content-Type: application/json

{"columnId": "01a15a40-c3bc-7392-9c37-587a01327a69", "position": 2}
```

```http
HTTP/1.1 204 No Content
```

- The other elements of the lists involved keep their relative order.
- R8: A position below 1 places the element first, one above N places it
  last, N counting the moved element in its target list.

### Errors

Added:

- 400: `position` is missing or not an integer; for a card, `columnId`
  is missing or not a string.
- 404: `columnId` names an unknown column, including a column of
  another user (R2).

## Boards UI

### Board screen, `/boards/{id}`

Added:

- Columns are shown in order, left to right, and cards top to bottom
  (layout not testable).

New section, after "Board screen":

## Drag and drop

- A column or a card is moved by dragging it.
- A column dropped onto another column, or a card dropped onto another
  card, takes that element's position.
- A card dropped onto a column, outside its cards, is placed last in
  that column.
- The new order is shown at once and kept after a reload.

## Technical

Added to `ts_vue`:

- Drag and drop uses the native HTML drag and drop API, without a
  library.
