import os
import uuid
from http.cookies import Morsel, SimpleCookie

import httpx

BASE_URL = os.environ.get("MINIKAN_API_URL", "http://localhost:8000")


def session_cookie(response: httpx.Response) -> Morsel:
    cookie: SimpleCookie = SimpleCookie()
    cookie.load(response.headers["set-cookie"])
    return cookie["session"]


def log_in(name: str, password: str) -> str:
    response = httpx.post(f"{BASE_URL}/api/login", json={"name": name, "password": password})
    assert response.status_code == 204
    return session_cookie(response).value


# The cookie is sent by hand: httpx keeps a Secure cookie to https URLs.
def client_for(token: str) -> httpx.Client:
    return httpx.Client(base_url=BASE_URL, headers={"Cookie": f"session={token}"})


def logged_in(name: str) -> httpx.Client:
    return client_for(log_in(name, f"{name}-password"))


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
