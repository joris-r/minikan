# deletion: delete boards, columns and cards

Boards, columns and cards can be deleted, through the API and through a
menu on each of them in the UI.

## Data model

- R5: Deleting a board deletes its columns and their cards; deleting a
  column deletes its cards.

## Boards API

### DELETE /api/boards/{id}, /api/columns/{id}, /api/cards/{id}

Delete a board, column or card:

```http
DELETE /api/columns/01a15a40-c3bc-7392-9c37-587c8a9d939a
Authorization: Bearer demo
```

```http
HTTP/1.1 204 No Content
```

## Boards UI

New section, after "Board screen":

## Actions menu

- Each board on the boards screen, and the board, each column and each
  card on the board screen, is an article (ARIA role) named by its
  title.
- Each of these articles has, right after its title, an icon button
  labelled "Actions", which opens a menu. Its only item is "Delete".
- R6: Deleting a board or column that holds a column or card first
  opens a modal dialog with the buttons "Delete" and "Cancel"; only
  "Delete" deletes it. An empty board or column, and a card, are
  deleted at once. (modal not testable)
- A deleted item disappears from the screen. Deleting the board shown
  on the board screen goes to the boards screen.

## Technical

Added to `ts_vue`:

- The dialog is an HTML `<dialog>` element, without a library.
