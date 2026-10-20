from collections.abc import Callable

import httpx
import pytest

from helpers import (
    assert_error,
    create_board,
    create_card,
    create_column,
    set_title,
    unique_title,
)


def _board(client: httpx.Client) -> tuple[str, str]:
    board = create_board(client)
    return f"/api/boards/{board['id']}", board["id"]


def _column(client: httpx.Client) -> tuple[str, str]:
    board = create_board(client)
    column = create_column(client, board["id"])
    return f"/api/columns/{column['id']}", board["id"]


def _card(client: httpx.Client) -> tuple[str, str]:
    board = create_board(client)
    column = create_column(client, board["id"])
    card = create_card(client, column["id"])
    return f"/api/cards/{card['id']}", board["id"]


def _titles(client: httpx.Client, board_id: str) -> list[str]:
    board = client.get(f"/api/boards/{board_id}").json()
    columns = board["columns"]
    return (
        [board["title"]]
        + [c["title"] for c in columns]
        + [card["title"] for c in columns for card in c["cards"]]
    )


# Each factory creates one entity and returns its PATCH path and its board id.
entities = pytest.mark.parametrize(
    "create", [_board, _column, _card], ids=["board", "column", "card"]
)


@entities
class TestPatchTitle:
    def test_sets_the_title(
        self, demo: httpx.Client, create: Callable[[httpx.Client], tuple[str, str]]
    ) -> None:
        path, board_id = create(demo)
        title = unique_title()

        response = demo.patch(path, json={"title": title})

        assert response.status_code == 200
        assert response.json() == {"id": path.rsplit("/", 1)[1], "title": title}
        assert title in _titles(demo, board_id)

    def test_sets_an_empty_title(
        self, demo: httpx.Client, create: Callable[[httpx.Client], tuple[str, str]]
    ) -> None:
        path, board_id = create(demo)
        set_title(demo, path, "Doing")

        response = demo.patch(path, json={"title": ""})

        assert response.status_code == 200
        assert response.json()["title"] == ""
        assert "Doing" not in _titles(demo, board_id)

    def test_accepts_100_characters(
        self, demo: httpx.Client, create: Callable[[httpx.Client], tuple[str, str]]
    ) -> None:
        path, board_id = create(demo)
        title = "é" * 100

        response = demo.patch(path, json={"title": title})

        assert response.status_code == 200
        assert title in _titles(demo, board_id)

    def test_rejects_101_characters(
        self, demo: httpx.Client, create: Callable[[httpx.Client], tuple[str, str]]
    ) -> None:
        path, board_id = create(demo)

        response = demo.patch(path, json={"title": "x" * 101})

        assert_error(response, 400)
        assert "x" * 101 not in _titles(demo, board_id)

    @pytest.mark.parametrize("body", [{}, {"title": None}, {"title": 42}, {"name": "Doing"}])
    def test_rejects_a_missing_or_non_string_title(
        self,
        demo: httpx.Client,
        create: Callable[[httpx.Client], tuple[str, str]],
        body: dict,
    ) -> None:
        path, _ = create(demo)

        assert_error(demo.patch(path, json=body), 400)

    def test_rejects_a_body_that_is_not_json(
        self, demo: httpx.Client, create: Callable[[httpx.Client], tuple[str, str]]
    ) -> None:
        path, _ = create(demo)

        response = demo.patch(
            path, content=b"title=Doing", headers={"Content-Type": "application/json"}
        )

        assert_error(response, 400)
