import httpx

from helpers import assert_error, create_board, create_card, create_column


class TestDeleteBoards:
    def test_deletes_the_board(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        kept = create_board(demo)

        response = demo.delete(f"/api/boards/{board['id']}")

        assert response.status_code == 204
        assert response.content == b""
        assert_error(demo.get(f"/api/boards/{board['id']}"), 404)
        ids = [b["id"] for b in demo.get("/api/boards").json()]
        assert board["id"] not in ids
        assert kept["id"] in ids

    def test_r5_deletes_its_columns_and_their_cards(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])
        card = create_card(demo, column["id"])

        assert demo.delete(f"/api/boards/{board['id']}").status_code == 204

        assert_error(demo.patch(f"/api/columns/{column['id']}", json={"title": "x"}), 404)
        assert_error(demo.post(f"/api/columns/{column['id']}/cards"), 404)
        assert_error(demo.patch(f"/api/cards/{card['id']}", json={"title": "x"}), 404)


class TestDeleteColumns:
    def test_deletes_the_column(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])
        kept = create_column(demo, board["id"])

        response = demo.delete(f"/api/columns/{column['id']}")

        assert response.status_code == 204
        assert response.content == b""
        columns = demo.get(f"/api/boards/{board['id']}").json()["columns"]
        assert columns == [{"id": kept["id"], "title": "", "cards": []}]

    def test_r5_deletes_its_cards(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])
        card = create_card(demo, column["id"])

        assert demo.delete(f"/api/columns/{column['id']}").status_code == 204

        assert_error(demo.patch(f"/api/cards/{card['id']}", json={"title": "x"}), 404)
        assert demo.get(f"/api/boards/{board['id']}").json()["columns"] == []


class TestDeleteCards:
    def test_deletes_the_card(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])
        card = create_card(demo, column["id"])
        kept = create_card(demo, column["id"])

        response = demo.delete(f"/api/cards/{card['id']}")

        assert response.status_code == 204
        assert response.content == b""
        columns = demo.get(f"/api/boards/{board['id']}").json()["columns"]
        assert columns == [
            {"id": column["id"], "title": "", "cards": [{"id": kept["id"], "title": ""}]}
        ]

    def test_a_deleted_card_is_unknown(self, demo: httpx.Client) -> None:
        board = create_board(demo)
        column = create_column(demo, board["id"])
        card = create_card(demo, column["id"])

        assert demo.delete(f"/api/cards/{card['id']}").status_code == 204

        assert_error(demo.delete(f"/api/cards/{card['id']}"), 404)
