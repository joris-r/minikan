from collections.abc import Iterator

import httpx
import pytest

from helpers import BASE_URL, logged_in


@pytest.fixture
def api() -> Iterator[httpx.Client]:
    with httpx.Client(base_url=BASE_URL) as client:
        yield client


@pytest.fixture
def demo() -> Iterator[httpx.Client]:
    with logged_in("demo") as client:
        yield client


@pytest.fixture
def other() -> Iterator[httpx.Client]:
    with logged_in("other") as client:
        yield client
