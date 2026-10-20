import uuid

import httpx


def unique_title() -> str:
    return f"title {uuid.uuid4().hex[:8]}"


def is_uuid7(value: object) -> bool:
    try:
        return isinstance(value, str) and uuid.UUID(value).version == 7
    except ValueError:
        return False


def create_board(client: httpx.Client) -> dict:
    response = client.post("/api/boards")
    assert response.status_code == 201
    return response.json()


def create_column(client: httpx.Client, board_id: str) -> dict:
    response = client.post(f"/api/boards/{board_id}/columns")
    assert response.status_code == 201
    return response.json()


def create_card(client: httpx.Client, column_id: str) -> dict:
    response = client.post(f"/api/columns/{column_id}/cards")
    assert response.status_code == 201
    return response.json()


def set_title(client: httpx.Client, path: str, title: str) -> dict:
    response = client.patch(path, json={"title": title})
    assert response.status_code == 200
    return response.json()


def assert_error(response: httpx.Response, status_code: int) -> None:
    assert response.status_code == status_code
    body = response.json()
    assert list(body) == ["error"]
    assert isinstance(body["error"], str)
