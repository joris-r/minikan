# boards: boards, columns and cards with a title

A user lists their boards and opens one; boards, columns and cards are
created with an empty title, which is set right after creation.

## Data model

- User
  - id
  - name: non-empty, unique; the Bearer token of the user's requests
  - Users named `demo` and `other` always exist; there is no way to
    create users.
- Board
  - id
  - title
  - belongs to one User
- Column
  - id
  - title
  - belongs to one Board
- Card
  - id
  - title
  - belongs to one Column
- Every id is a UUIDv7, assigned by the backend.
- A title is a string of 0 to 100 characters, empty when created.
- The order of boards, columns and cards is not specified.

## API

Every request carries `Authorization: Bearer <user name>`.

### GET /api/boards

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

### POST /api/boards

```http
POST /api/boards
Authorization: Bearer demo
```

```http
HTTP/1.1 201 Created

{"id": "01a15a40-c3bc-7392-9c37-5878ee132d47", "title": ""}
```

### GET /api/boards/{id}

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

### POST /api/boards/{id}/columns, POST /api/columns/{id}/cards

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

### PATCH /api/boards/{id}, /api/columns/{id}, /api/cards/{id}

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

### Errors

- Error responses are JSON: `{"error": "<message>"}`.
- 400: the body is not JSON, or `title` is missing, not a string or
  longer than 100 characters.
- 401: the `Authorization` header is missing or names no existing user.
- 404: unknown board, column or card.
- R2: A board of another user, and its columns and cards, are answered
  as unknown (404).

## Screens

The frontend acts as the user `demo`.

### Boards screen, `/`

- Lists the user's boards by title; each opens its board screen.
- An icon button labelled "Add board" creates a board.

### Board screen, `/boards/{id}`

- Shows the board's title, then its columns side by side, each with its
  cards stacked (layout not testable).
- An icon button labelled "Add column" creates a column in the board.
- In each column, an icon button labelled "Add card" creates a card in
  that column.

### Creating

- R3: After a board, column or card is created, its title is shown as a
  focused, empty text input. Enter, or leaving the input, records the
  title, even empty, and the input is replaced by the title as text.
- An empty title is shown as "(Untitled)".

## Technical

- `ts_vue`: Vue Router for the two screens.
- Every backend's `run` target accepts `TEMP_STORAGE=1`: the backend
  starts with storage holding only the seeded users, and discards it
  when it stops. The root runner uses it for the shared suites.
- The shared suites never assume an empty storage: they check only
  what they created.
- The Tests phase writes the shared suites; an implementation's own
  unit tests are written during Implementation.
