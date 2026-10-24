import uuid

import httpx
import pytest

from helpers import assert_error, create_board, create_card, create_column


def _board_with_columns(client: httpx.Client, count: int) -> tuple[str, list[str]]:
    board = create_board(client)
    return board["id"], [create_column(client, board["id"])["id"] for _ in range(count)]


def _column_with_cards(client: httpx.Client, board_id: str, count: int) -> tuple[str, list[str]]:
    column = create_column(client, board_id)
    return column["id"], [create_card(client, column["id"])["id"] for _ in range(count)]


def _column_ids(client: httpx.Client, board_id: str) -> list[str]:
    return [c["id"] for c in client.get(f"/api/boards/{board_id}").json()["columns"]]


def _card_ids(client: httpx.Client, board_id: str, column_id: str) -> list[str]:
    columns = client.get(f"/api/boards/{board_id}").json()["columns"]
    return [card["id"] for c in columns if c["id"] == column_id for card in c["cards"]]


def _move_column(client: httpx.Client, column_id: str, position: object) -> httpx.Response:
    return client.post(f"/api/columns/{column_id}/move", json={"position": position})


def _move_card(
    client: httpx.Client, card_id: str, column_id: str, position: object
) -> httpx.Response:
    return client.post(
        f"/api/cards/{card_id}/move", json={"columnId": column_id, "position": position}
    )


class TestR7NewLast:
    def test_columns_are_in_creation_order(self, demo: httpx.Client) -> None:
        board_id, columns = _board_with_columns(demo, 3)

        assert _column_ids(demo, board_id) == columns

    def test_cards_are_in_creation_order(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column_id, cards = _column_with_cards(demo, board["id"], 3)

        assert _card_ids(demo, board["id"], column_id) == cards

    def test_a_new_column_is_last_after_a_move(self, demo: httpx.Client) -> None:
        board_id, [a, b] = _board_with_columns(demo, 2)
        _move_column(demo, b, 1)

        c = create_column(demo, board_id)["id"]

        assert _column_ids(demo, board_id) == [b, a, c]

    def test_a_new_card_is_last_after_a_move(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column_id, [a, b] = _column_with_cards(demo, board["id"], 2)
        _move_card(demo, b, column_id, 1)

        c = create_card(demo, column_id)["id"]

        assert _card_ids(demo, board["id"], column_id) == [b, a, c]


class TestMoveColumn:
    def test_moves_a_column_to_the_first_position(self, demo: httpx.Client) -> None:
        board_id, [a, b, c] = _board_with_columns(demo, 3)

        response = _move_column(demo, c, 1)

        assert response.status_code == 204
        assert response.content == b""
        assert _column_ids(demo, board_id) == [c, a, b]

    def test_moves_a_column_towards_the_end(self, demo: httpx.Client) -> None:
        board_id, [a, b, c, d] = _board_with_columns(demo, 4)

        assert _move_column(demo, a, 3).status_code == 204

        assert _column_ids(demo, board_id) == [b, c, a, d]

    def test_moving_to_its_own_position_changes_nothing(self, demo: httpx.Client) -> None:
        board_id, [a, b, c] = _board_with_columns(demo, 3)

        assert _move_column(demo, b, 2).status_code == 204

        assert _column_ids(demo, board_id) == [a, b, c]

    def test_keeps_the_cards_of_the_column(self, demo: httpx.Client) -> None:
        board_id, [a] = _board_with_columns(demo, 1)
        b, cards = _column_with_cards(demo, board_id, 2)

        _move_column(demo, b, 1)

        assert _column_ids(demo, board_id) == [b, a]
        assert _card_ids(demo, board_id, b) == cards

    def test_leaves_other_boards_unchanged(self, demo: httpx.Client) -> None:
        board_id, [a, b] = _board_with_columns(demo, 2)
        other_board, others = _board_with_columns(demo, 2)

        _move_column(demo, b, 1)

        assert _column_ids(demo, board_id) == [b, a]
        assert _column_ids(demo, other_board) == others

    @pytest.mark.parametrize("position", [0, -5])
    def test_r8_a_position_below_1_places_it_first(self, demo: httpx.Client, position: int) -> None:
        board_id, [a, b, c] = _board_with_columns(demo, 3)

        assert _move_column(demo, c, position).status_code == 204

        assert _column_ids(demo, board_id) == [c, a, b]

    @pytest.mark.parametrize("position", [4, 99])
    def test_r8_a_position_above_n_places_it_last(self, demo: httpx.Client, position: int) -> None:
        board_id, [a, b, c] = _board_with_columns(demo, 3)

        assert _move_column(demo, a, position).status_code == 204

        assert _column_ids(demo, board_id) == [b, c, a]


class TestMoveCard:
    def test_moves_a_card_to_another_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        todo, [x, y] = _column_with_cards(demo, board["id"], 2)
        done, [p, q] = _column_with_cards(demo, board["id"], 2)

        response = _move_card(demo, x, done, 2)

        assert response.status_code == 204
        assert response.content == b""
        assert _card_ids(demo, board["id"], todo) == [y]
        assert _card_ids(demo, board["id"], done) == [p, x, q]

    def test_moves_a_card_to_an_empty_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        todo, [x, y] = _column_with_cards(demo, board["id"], 2)
        done, _ = _column_with_cards(demo, board["id"], 0)

        assert _move_card(demo, y, done, 1).status_code == 204

        assert _card_ids(demo, board["id"], todo) == [x]
        assert _card_ids(demo, board["id"], done) == [y]

    def test_moves_a_card_up_in_its_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column, [a, b, c, d] = _column_with_cards(demo, board["id"], 4)

        assert _move_card(demo, d, column, 2).status_code == 204

        assert _card_ids(demo, board["id"], column) == [a, d, b, c]

    def test_moves_a_card_down_in_its_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column, [a, b, c, d] = _column_with_cards(demo, board["id"], 4)

        assert _move_card(demo, a, column, 3).status_code == 204

        assert _card_ids(demo, board["id"], column) == [b, c, a, d]

    def test_moves_a_card_to_a_column_of_another_board(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        todo, [x, y] = _column_with_cards(demo, board["id"], 2)
        elsewhere = create_board(demo)
        target, [p] = _column_with_cards(demo, elsewhere["id"], 1)

        assert _move_card(demo, x, target, 1).status_code == 204

        assert _card_ids(demo, board["id"], todo) == [y]
        assert _card_ids(demo, elsewhere["id"], target) == [x, p]

    @pytest.mark.parametrize("position", [0, -5])
    def test_r8_a_position_below_1_places_it_first(self, demo: httpx.Client, position: int) -> None:
        board = create_board(demo)
        todo, [x] = _column_with_cards(demo, board["id"], 1)
        done, [p, q] = _column_with_cards(demo, board["id"], 2)

        assert _move_card(demo, x, done, position).status_code == 204

        assert _card_ids(demo, board["id"], todo) == []
        assert _card_ids(demo, board["id"], done) == [x, p, q]

    @pytest.mark.parametrize("position", [4, 99])
    def test_r8_a_position_above_n_places_it_last_in_another_column(
        self, demo: httpx.Client, position: int
    ) -> None:
        board = create_board(demo)
        _, [x] = _column_with_cards(demo, board["id"], 1)
        done, [p, q, r] = _column_with_cards(demo, board["id"], 3)

        assert _move_card(demo, x, done, position).status_code == 204

        assert _card_ids(demo, board["id"], done) == [p, q, r, x]

    @pytest.mark.parametrize("position", [3, 99])
    def test_r8_a_position_above_n_places_it_last_in_its_column(
        self, demo: httpx.Client, position: int
    ) -> None:
        board = create_board(demo)
        column, [a, b, c] = _column_with_cards(demo, board["id"], 3)

        assert _move_card(demo, a, column, position).status_code == 204

        assert _card_ids(demo, board["id"], column) == [b, c, a]


class TestMoveErrors:
    @pytest.mark.parametrize(
        "body",
        [{}, {"position": None}, {"position": "abc"}, {"position": 1.5}, {"position": True}],
    )
    def test_column_rejects_a_missing_or_non_integer_position(
        self, demo: httpx.Client, body: dict
    ) -> None:
        board_id, columns = _board_with_columns(demo, 2)

        assert_error(demo.post(f"/api/columns/{columns[1]}/move", json=body), 400)

        assert _column_ids(demo, board_id) == columns

    @pytest.mark.parametrize(
        "body",
        [
            {"position": 1},
            {"columnId": None, "position": 1},
            {"columnId": 42, "position": 1},
            {"columnId": "{column}"},
            {"columnId": "{column}", "position": None},
            {"columnId": "{column}", "position": "abc"},
            {"columnId": "{column}", "position": 1.5},
            {"columnId": "{column}", "position": True},
        ],
    )
    def test_card_rejects_a_missing_or_invalid_field(self, demo: httpx.Client, body: dict) -> None:
        board = create_board(demo)
        column, cards = _column_with_cards(demo, board["id"], 2)
        body = {k: column if v == "{column}" else v for k, v in body.items()}

        assert_error(demo.post(f"/api/cards/{cards[1]}/move", json=body), 400)

        assert _card_ids(demo, board["id"], column) == cards

    @pytest.mark.parametrize("path", ["/api/columns/{id}/move", "/api/cards/{id}/move"])
    def test_rejects_a_body_that_is_not_json(self, demo: httpx.Client, path: str) -> None:
        board = create_board(demo)
        column, [card] = _column_with_cards(demo, board["id"], 1)
        entity = column if path.startswith("/api/columns") else card

        response = demo.post(
            path.format(id=entity),
            content=b"position=1",
            headers={"Content-Type": "application/json"},
        )

        assert_error(response, 400)

    @pytest.mark.parametrize("column_id", [str(uuid.uuid7()), "42"])
    def test_card_rejects_an_unknown_column(self, demo: httpx.Client, column_id: str) -> None:
        board = create_board(demo)
        column, [card] = _column_with_cards(demo, board["id"], 1)

        assert_error(_move_card(demo, card, column_id, 1), 404)

        assert _card_ids(demo, board["id"], column) == [card]

    def test_r2_card_rejects_a_column_of_another_user(
        self, demo: httpx.Client, other: httpx.Client
    ) -> None:
        board = create_board(demo)
        column, [card] = _column_with_cards(demo, board["id"], 1)
        theirs = create_board(other)
        target, _ = _column_with_cards(other, theirs["id"], 0)

        assert_error(_move_card(demo, card, target, 1), 404)

        assert _card_ids(demo, board["id"], column) == [card]
        assert _card_ids(other, theirs["id"], target) == []
