# Operations

## General

Every operation is an HTTP endpoint under `/api`.

- [json] Bodies are JSON, their field names in camelCase.
- [error] An operation refused answers `{"error": "<message>"}`.
- [malformed] Body not JSON, a field missing, or a value of the wrong
  type: refused, 400, with a message naming the error.

## Health check

HTTP: `GET /api/health`.

- [result] Answers 200 with `{"status": "ok"}`.
