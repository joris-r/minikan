# Boards API

A heading naming several endpoints groups distinct endpoints that
behave alike; its example shows one of them.

## GET /api/boards

```http
GET /api/boards
Authorization: Bearer demo
```

```http
HTTP/1.1 200 OK

[
  {"id": "01a15a40-c3bc-7392-9c37-5876fc850924", "title": "Roadmap"},
  {"id": "01a15a40-c3bc-7392-9c37-587731b7a861", "title": ""}
]
```

- R1: Lists only the boards of the requesting user.

## POST /api/boards

```http
POST /api/boards
Authorization: Bearer demo
```

```http
HTTP/1.1 201 Created

{"id": "01a15a40-c3bc-7392-9c37-5878ee132d47", "title": ""}
```

## GET /api/boards/{id}

`columns` and each `cards` are in order.

```http
GET /api/boards/01a15a40-c3bc-7392-9c37-5876fc850924
Authorization: Bearer demo
```

```http
HTTP/1.1 200 OK

{
  "id": "01a15a40-c3bc-7392-9c37-5876fc850924",
  "title": "Roadmap",
  "columns": [
    {
      "id": "01a15a40-c3bc-7392-9c37-587958bf27d9",
      "title": "To do",
      "cards": [{"id": "01a15a40-c3bc-7392-9c37-587b93cbbd02", "title": "Write the spec"}]
    },
    {"id": "01a15a40-c3bc-7392-9c37-587a01327a69", "title": "Done", "cards": []}
  ]
}
```

## POST /api/boards/{id}/columns, POST /api/columns/{id}/cards

Create an empty column in a board, or an empty card in a column, like
`POST /api/boards`:

```http
POST /api/boards/01a15a40-c3bc-7392-9c37-5876fc850924/columns
Authorization: Bearer demo
```

```http
HTTP/1.1 201 Created

{"id": "01a15a40-c3bc-7392-9c37-587c8a9d939a", "title": ""}
```

## PATCH /api/boards/{id}, /api/columns/{id}, /api/cards/{id}

Set the title of a board, column or card:

```http
PATCH /api/columns/01a15a40-c3bc-7392-9c37-587c8a9d939a
Authorization: Bearer demo
Content-Type: application/json

{"title": "Doing"}
```

```http
HTTP/1.1 200 OK

{"id": "01a15a40-c3bc-7392-9c37-587c8a9d939a", "title": "Doing"}
```

## DELETE /api/boards/{id}, /api/columns/{id}, /api/cards/{id}

Delete a board, column or card:

```http
DELETE /api/columns/01a15a40-c3bc-7392-9c37-587c8a9d939a
Authorization: Bearer demo
```

```http
HTTP/1.1 204 No Content
```

## POST /api/columns/{id}/move

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

## POST /api/cards/{id}/move

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

## Errors

- 400: the body is not JSON, or `title` is missing, not a string or
  longer than 100 characters, or `position` is missing or does not
  denote an integer (e.g. `1.5`, `true`, `null`), or for a card move
  `columnId` is missing or not a string.
- 404: unknown board, column or card, including a `columnId`.
- R2: A board of another user, and its columns and cards, are answered
  as unknown (404).
