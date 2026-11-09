# Auth API

## POST /api/login

```http
POST /api/login
Content-Type: application/json

{"name": "demo", "password": "demo-password"}
```

```http
HTTP/1.1 204 No Content
Set-Cookie: session=Xq2v…; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

- Needs no session.
- R12: An unknown name and a wrong password get the same answer:
  401, `{"error": "Invalid name or password"}`, and no cookie.

## POST /api/logout

```http
POST /api/logout
Cookie: session=Xq2v…
```

```http
HTTP/1.1 204 No Content
Set-Cookie: session=; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

- R13: After logout, that session's token gets 401; the user's other
  sessions still work.

## GET /api/session

The user of the current session:

```http
GET /api/session
Cookie: session=Xq2v…
```

```http
HTTP/1.1 200 OK

{"name": "demo"}
```

## Errors

- 400: the body is not JSON, or `name` or `password` is missing or not
  a string.
