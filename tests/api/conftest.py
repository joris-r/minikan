import os
from collections.abc import Iterator

import httpx
import pytest

BASE_URL = os.environ.get("MINIKAN_API_URL", "http://localhost:8000")


@pytest.fixture
def api() -> Iterator[httpx.Client]:
    with httpx.Client(base_url=BASE_URL) as client:
        yield client


@pytest.fixture
def demo() -> Iterator[httpx.Client]:
    with httpx.Client(base_url=BASE_URL, headers={"Authorization": "Bearer demo"}) as client:
        yield client


@pytest.fixture
def other() -> Iterator[httpx.Client]:
    with httpx.Client(base_url=BASE_URL, headers={"Authorization": "Bearer other"}) as client:
        yield client
