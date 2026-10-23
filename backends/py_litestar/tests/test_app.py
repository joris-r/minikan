import pytest
from litestar.exceptions import NotFoundException
from litestar.testing import TestClient

from minikan.app import app


def test_health() -> None:
    with TestClient(app=app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200


def test_seeded_users_can_authenticate() -> None:
    with TestClient(app=app) as client:
        for name in ["demo", "other"]:
            response = client.get("/api/boards", headers={"Authorization": f"Bearer {name}"})
            assert response.status_code == 200


def test_a_restart_does_not_seed_users_twice() -> None:
    with TestClient(app=app):
        pass
    with TestClient(app=app) as client:
        response = client.get("/api/boards", headers={"Authorization": "Bearer demo"})
    assert response.status_code == 200


def test_the_authorization_scheme_must_be_bearer() -> None:
    with TestClient(app=app) as client:
        response = client.get("/api/boards", headers={"Authorization": "Basic demo"})
    assert response.status_code == 401


def test_an_unknown_route_answers_a_json_error() -> None:
    with TestClient(app=app) as client:
        response = client.get("/api/nothing")
    assert response.status_code == 404
    assert list(response.json()) == ["error"]


def test_parse_id_rejects_a_malformed_id_as_not_found() -> None:
    from minikan.boards.controllers import parse_id

    with pytest.raises(NotFoundException):
        parse_id("42")


def test_foreign_keys_are_enforced() -> None:
    from sqlalchemy import text

    from minikan.db import db_config

    async def foreign_keys() -> int:
        async with db_config.get_engine().connect() as conn:
            return (await conn.execute(text("PRAGMA foreign_keys"))).scalar_one()

    with TestClient(app=app) as client:
        assert client.blocking_portal.call(foreign_keys) == 1
