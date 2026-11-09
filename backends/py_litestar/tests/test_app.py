import pytest
from litestar.exceptions import NotFoundException
from litestar.testing import TestClient

from minikan.app import app


def test_health() -> None:
    with TestClient(app=app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200


def log_in(client: TestClient, name: str) -> str:
    response = client.post("/api/login", json={"name": name, "password": f"{name}-password"})
    assert response.status_code == 204
    return response.cookies["session"]


def test_seeded_users_can_log_in() -> None:
    with TestClient(app=app) as client:
        for name in ["demo", "other"]:
            token = log_in(client, name)
            response = client.get("/api/session", headers={"Cookie": f"session={token}"})
            assert response.json() == {"name": name}


def test_a_restart_does_not_seed_users_twice() -> None:
    with TestClient(app=app):
        pass
    with TestClient(app=app) as client:
        log_in(client, "demo")


def test_an_expired_session_is_rejected() -> None:
    from datetime import UTC, datetime

    from sqlalchemy import update

    from minikan.accounts.services import hash_token
    from minikan.db import db_config
    from minikan.models import Session

    async def expire(token: str) -> None:
        async with db_config.get_session() as db:
            await db.execute(
                update(Session)
                .where(Session.token_hash == hash_token(token))
                .values(expires_at=datetime.now(UTC))
            )
            await db.commit()

    with TestClient(app=app) as client:
        token = log_in(client, "demo")
        client.blocking_portal.call(expire, token)
        response = client.get("/api/session", headers={"Cookie": f"session={token}"})
    assert response.status_code == 401


def test_the_storage_keeps_only_a_hash_of_the_token() -> None:
    from sqlalchemy import select

    from minikan.accounts.services import hash_token
    from minikan.db import db_config
    from minikan.models import Session

    async def stored() -> list[str]:
        async with db_config.get_session() as db:
            return list((await db.scalars(select(Session.token_hash))).all())

    with TestClient(app=app) as client:
        token = log_in(client, "demo")
        hashes = client.blocking_portal.call(stored)
    assert hash_token(token) in hashes
    assert token not in hashes


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
