from litestar.testing import TestClient

from minikan.app import app


def test_health() -> None:
    with TestClient(app=app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
