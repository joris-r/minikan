import httpx


def test_health(api: httpx.Client) -> None:
    # /operations/health-check/result, /accounts/operations/general/session
    response = api.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
