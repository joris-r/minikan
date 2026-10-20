import os
from collections.abc import Iterator

import httpx
import pytest


@pytest.fixture
def api() -> Iterator[httpx.Client]:
    base_url = os.environ.get("MINIKAN_API_URL", "http://localhost:8000")
    with httpx.Client(base_url=base_url) as client:
        yield client
