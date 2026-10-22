# litestar-typed-bodies: explicit body types in py_litestar

Backend `py_litestar` declares its request and response bodies as
explicit types. The API does not change.

## Technical

- `py_litestar`, added to its list in `Implementations`:
  - Request and response bodies are `msgspec.Struct` types declared in
    the controllers' modules; handlers declare them as their parameter
    and return types, never dicts.
