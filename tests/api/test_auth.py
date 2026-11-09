import httpx
import pytest

from helpers import assert_error, client_for, log_in, session_cookie


class TestPostLogin:
    def test_sets_the_session_cookie(self, api: httpx.Client) -> None:
        # /accounts/operations/log-in/accepted, /accounts/operations/general/session
        response = api.post("/api/login", json={"name": "demo", "password": "demo-password"})

        assert response.status_code == 204
        cookie = session_cookie(response)
        assert cookie.value != ""
        assert cookie["path"] == "/api"
        assert cookie["httponly"] is True
        assert cookie["secure"] is True
        assert cookie["samesite"].lower() == "strict"
        assert cookie["max-age"] == "604800"

    def test_the_session_identifies_the_user(self) -> None:
        # /accounts/operations/log-in/accepted, /accounts/model/user/seeded
        with client_for(log_in("other", "other-password")) as client:
            assert client.get("/api/session").json() == {"name": "other"}

    def test_a_user_may_have_several_sessions_at_once(self) -> None:
        # /accounts/model/session/several
        first = log_in("demo", "demo-password")
        second = log_in("demo", "demo-password")

        assert first != second
        for token in (first, second):
            with client_for(token) as client:
                assert client.get("/api/session").status_code == 200

    @pytest.mark.parametrize(
        ("name", "password"),
        [("demo", "wrong-password"), ("nobody", "demo-password"), ("demo", "other-password")],
    )
    def test_rejects_an_unknown_name_or_a_wrong_password(
        self, api: httpx.Client, name: str, password: str
    ) -> None:
        # /accounts/operations/log-in/rejected, /operations/general/error
        response = api.post("/api/login", json={"name": name, "password": password})

        assert response.status_code == 401
        assert response.json() == {"error": "Invalid name or password"}
        assert "set-cookie" not in response.headers

    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"name": "demo"},
            {"password": "demo-password"},
            {"name": 1, "password": "demo-password"},
            {"name": "demo", "password": None},
        ],
        ids=["empty", "no password", "no name", "name not a string", "password not a string"],
    )
    def test_rejects_a_malformed_body(self, api: httpx.Client, body: dict) -> None:
        # /operations/general/malformed
        assert_error(api.post("/api/login", json=body), 400)

    def test_rejects_a_body_that_is_not_json(self, api: httpx.Client) -> None:
        # /operations/general/malformed
        response = api.post(
            "/api/login", content=b"name=demo", headers={"Content-Type": "application/json"}
        )

        assert_error(response, 400)


class TestPostLogout:
    def test_clears_the_session_cookie(self) -> None:
        # /accounts/operations/log-out/ended
        with client_for(log_in("demo", "demo-password")) as client:
            response = client.post("/api/logout")

        assert response.status_code == 204
        cookie = session_cookie(response)
        assert cookie.value == ""
        assert cookie["path"] == "/api"
        assert cookie["max-age"] == "0"

    def test_the_cleared_cookie_has_the_session_attributes(self) -> None:
        # /accounts/operations/log-out/ended
        with client_for(log_in("demo", "demo-password")) as client:
            response = client.post("/api/logout")

        cookie = session_cookie(response)
        assert cookie["httponly"] is True
        assert cookie["secure"] is True
        assert cookie["samesite"].lower() == "strict"

    def test_ends_only_that_session(self) -> None:
        # /accounts/operations/log-out/ended
        ended = log_in("demo", "demo-password")
        kept = log_in("demo", "demo-password")
        with client_for(ended) as client:
            assert client.post("/api/logout").status_code == 204

            assert_error(client.get("/api/session"), 401)
            assert_error(client.get("/api/boards"), 401)
        with client_for(kept) as client:
            assert client.get("/api/session").status_code == 200

    def test_the_ended_token_gets_the_unauthorized_message(self) -> None:
        # /accounts/operations/log-out/ended
        with client_for(log_in("demo", "demo-password")) as client:
            assert client.post("/api/logout").status_code == 204

            response = client.get("/api/session")

        assert response.status_code == 401
        assert response.json() == {"error": "Unauthorized"}


class TestGetSession:
    def test_ignores_the_authorization_header(self) -> None:
        # /accounts/operations/general/header
        with client_for(log_in("demo", "demo-password")) as client:
            response = client.get("/api/session", headers={"Authorization": "Bearer other"})

        assert response.json() == {"name": "demo"}

    def test_returns_the_user_of_the_session(self, demo: httpx.Client) -> None:
        # /accounts/operations/show-session/result, /accounts/model/user/seeded
        response = demo.get("/api/session")

        assert response.status_code == 200
        assert response.json() == {"name": "demo"}
