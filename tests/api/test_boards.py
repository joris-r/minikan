import httpx

from helpers import (
    create_board,
    create_card,
    create_column,
    is_uuid7,
    set_title,
    unique_title,
)


class TestGetBoards:
    def test_lists_the_boards_of_the_user(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        titled = create_board(demo)
        title = unique_title()
        set_title(demo, f"/api/boards/{titled['id']}", title)

        response = demo.get("/api/boards")

        assert response.status_code == 200
        boards = response.json()
        assert {"id": board["id"], "title": ""} in boards
        assert {"id": titled["id"], "title": title} in boards

    def test_r1_does_not_list_boards_of_another_user(
        self, demo: httpx.Client, other: httpx.Client
    ) -> None:
        board = create_board(other)

        response = demo.get("/api/boards")

        assert response.status_code == 200
        assert board["id"] not in [b["id"] for b in response.json()]


class TestPostBoards:
    def test_creates_an_empty_board(self, demo: httpx.Client) -> None:
        response = demo.post("/api/boards")

        assert response.status_code == 201
        board = response.json()
        assert board["title"] == ""
        assert is_uuid7(board["id"])
        assert list(board) == ["id", "title"]

    def test_ids_are_unique(self, demo: httpx.Client) -> None:
        assert create_board(demo)["id"] != create_board(demo)["id"]


class TestGetBoard:
    def test_returns_the_board_with_its_columns_and_cards(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        set_title(demo, f"/api/boards/{board['id']}", "Roadmap")
        todo = create_column(demo, board["id"])
        set_title(demo, f"/api/columns/{todo['id']}", "To do")
        done = create_column(demo, board["id"])
        set_title(demo, f"/api/columns/{done['id']}", "Done")
        card = create_card(demo, todo["id"])
        set_title(demo, f"/api/cards/{card['id']}", "Write the spec")

        response = demo.get(f"/api/boards/{board['id']}")

        assert response.status_code == 200
        body = response.json()
        assert body["id"] == board["id"]
        assert body["title"] == "Roadmap"
        assert list(body) == ["id", "title", "columns"]
        assert body["columns"] == [
            {
                "id": todo["id"],
                "title": "To do",
                "cards": [{"id": card["id"], "title": "Write the spec"}],
            },
            {"id": done["id"], "title": "Done", "cards": []},
        ]

    def test_a_new_board_has_no_columns(self, demo: httpx.Client) -> None:
        board = create_board(demo)

        response = demo.get(f"/api/boards/{board['id']}")

        assert response.status_code == 200
        assert response.json() == {"id": board["id"], "title": "", "columns": []}
