import uuid

import httpx
import pytest

from helpers import assert_error, create_board, create_card, create_column

# A request on every endpoint of the change, as (method, path); "{board}",
# "{column}" and "{card}" are replaced by ids.
ENDPOINTS = [
    ("GET", "/api/boards"),
    ("POST", "/api/boards"),
    ("GET", "/api/boards/{board}"),
    ("PATCH", "/api/boards/{board}"),
    ("POST", "/api/boards/{board}/columns"),
    ("PATCH", "/api/columns/{column}"),
    ("POST", "/api/columns/{column}/cards"),
    ("PATCH", "/api/cards/{card}"),
]

WITH_ID = [e for e in ENDPOINTS if "{" in e[1]]


def _request(
    client: httpx.Client,
    method: str,
    path: str,
    ids: dict[str, str],
    headers: dict[str, str] | None = None,
) -> httpx.Response:
    body = {"title": "Doing"} if method == "PATCH" else None
    return client.request(method, path.format(**ids), json=body, headers=headers)


def _entities(client: httpx.Client) -> dict[str, str]:
    board = create_board(client)
    column = create_column(client, board["id"])
    card = create_card(client, column["id"])
    return {"board": board["id"], "column": column["id"], "card": card["id"]}


def _ids(endpoints: list[tuple[str, str]]) -> list[str]:
    return [f"{method} {path}" for method, path in endpoints]


class TestUnauthorized:
    @pytest.mark.parametrize(("method", "path"), ENDPOINTS, ids=_ids(ENDPOINTS))
    def test_rejects_a_missing_authorization(
        self, api: httpx.Client, demo: httpx.Client, method: str, path: str
    ) -> None:
        assert_error(_request(api, method, path, _entities(demo)), 401)

    @pytest.mark.parametrize(("method", "path"), ENDPOINTS, ids=_ids(ENDPOINTS))
    def test_rejects_an_unknown_user(
        self, api: httpx.Client, demo: httpx.Client, method: str, path: str
    ) -> None:
        response = _request(
            api, method, path, _entities(demo), headers={"Authorization": "Bearer nobody"}
        )

        assert_error(response, 401)


class TestNotFound:
    @pytest.mark.parametrize(("method", "path"), WITH_ID, ids=_ids(WITH_ID))
    def test_unknown_id(self, demo: httpx.Client, method: str, path: str) -> None:
        unknown = str(uuid.uuid7())
        ids = {"board": unknown, "column": unknown, "card": unknown}

        assert_error(_request(demo, method, path, ids), 404)

    @pytest.mark.parametrize(("method", "path"), WITH_ID, ids=_ids(WITH_ID))
    def test_malformed_id(self, demo: httpx.Client, method: str, path: str) -> None:
        ids = {"board": "42", "column": "42", "card": "42"}

        assert_error(_request(demo, method, path, ids), 404)

    @pytest.mark.parametrize(("method", "path"), WITH_ID, ids=_ids(WITH_ID))
    def test_r2_entities_of_another_user(
        self, demo: httpx.Client, other: httpx.Client, method: str, path: str
    ) -> None:
        ids = _entities(other)

        assert_error(_request(demo, method, path, ids), 404)

        assert other.get(f"/api/boards/{ids['board']}").json() == {
            "id": ids["board"],
            "title": "",
            "columns": [
                {"id": ids["column"], "title": "", "cards": [{"id": ids["card"], "title": ""}]}
            ],
        }
