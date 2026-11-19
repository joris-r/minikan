# Operations

## General

Every operation is an HTTP endpoint under `/api`. Each also reads
`now: time`, the current instant.

- [json] Bodies are JSON, their field names in camelCase.
- [error] An operation refused answers `{"error": "<message>"}`.
- [malformed] Body not JSON, a field missing, or a value of the wrong
  type: refused, 400, with a message naming the error.

## Initial state

- [users] The users `demo` and `other`, with the passwords
  `demo-password` and `other-password`.
- [empty] No session, board, column or card.

## Health check

HTTP: `GET /api/health`.

Inputs: none.

Cases:
- [result] Answers 200 with `{"status": "ok"}`.
