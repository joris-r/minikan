# lax-integers: lax decoding of integers

py_litestar decodes positions with Litestar's default lax decoding;
the API requires an error only for values that do not denote an
integer.

## Boards API

### Errors

Replaces the 400 error:

- 400: the body is not JSON, or `title` is missing, not a string or
  longer than 100 characters, or `position` is missing or does not
  denote an integer (e.g. `1.5`, `true`, `null`), or for a card move
  `columnId` is missing or not a string.

## Technical

Added to `py_litestar`:

- Bodies are decoded in Litestar's lax mode: a position may also be
  given as a string or a float holding an integer (`"1"`, `1.0`,
  `"1.0"`).
