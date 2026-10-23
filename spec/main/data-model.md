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
- The columns of a board, and the cards of a column, are ordered. Their
  positions run from 1 to N, N being the number of elements.
- The order of boards is not specified.
- R7: A new column or card is placed last.
- R5: Deleting a board deletes its columns and their cards; deleting a
  column deletes its cards.
