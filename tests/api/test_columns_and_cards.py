import httpx

from helpers import create_board, create_column, is_uuid7


class TestPostColumns:
    def test_creates_an_empty_column_in_the_board(self, demo: httpx.Client) -> None:
        board = create_board(demo)

        response = demo.post(f"/api/boards/{board['id']}/columns")

        assert response.status_code == 201
        column = response.json()
        assert column["title"] == ""
        assert is_uuid7(column["id"])
        assert list(column) == ["id", "title"]
        columns = demo.get(f"/api/boards/{board['id']}").json()["columns"]
        assert columns == [{"id": column["id"], "title": "", "cards": []}]


class TestPostCards:
    def test_creates_an_empty_card_in_the_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])

        response = demo.post(f"/api/columns/{column['id']}/cards")

        assert response.status_code == 201
        card = response.json()
        assert card["title"] == ""
        assert is_uuid7(card["id"])
        assert list(card) == ["id", "title"]
        columns = demo.get(f"/api/boards/{board['id']}").json()["columns"]
        assert columns == [
            {"id": column["id"], "title": "", "cards": [{"id": card["id"], "title": ""}]}
        ]
