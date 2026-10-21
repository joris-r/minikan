# litestar-layers: the py_litestar backend in framework layers

The `py_litestar` backend is restructured with Advanced Alchemy
services and Litestar controllers, split into modules by domain. The
behavior and the API are unchanged.

## Technical

Replaces the `py_litestar` item of Implementations:

- `py_litestar`: Python 3.14, Litestar, SQLite, uv, ruff, pytest.
  Database access through SQLAlchemy (Advanced Alchemy), with
  aiosqlite. The schema is created at startup from the models, without
  migrations.
  - Database access goes through one Advanced Alchemy service per
    model (`SQLAlchemyAsyncRepositoryService`, with its repository),
    injected with `create_service_provider`.
  - Routes are grouped in one Litestar `Controller` per resource.
  - Modules, by domain:

    ```
    src/minikan/
      app.py        # assembles the app: plugins, routers, error handlers, startup
      db.py         # database configuration, temporary storage, schema and seeded users
      models.py
      accounts/     # User: service, current user dependency
      boards/       # Board, Column, Card: services, controllers
    ```
