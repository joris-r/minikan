# Data model

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
- R5: Deleting a board deletes its columns and their cards; deleting a
  column deletes its cards.
