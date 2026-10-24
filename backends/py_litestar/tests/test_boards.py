import pytest

from minikan.boards.services import move


@pytest.mark.parametrize(
    ("position", "expected"),
    [(1, ["c", "a", "b"]), (2, ["a", "c", "b"]), (0, ["c", "a", "b"]), (9, ["a", "b", "c"])],
)
def test_move_within_a_list_clamps_the_position(position: int, expected: list[str]) -> None:
    items = ["a", "b", "c"]

    move(items, items, "c", position)

    assert items == expected


def test_move_between_lists_may_place_last() -> None:
    source, target = ["a", "b"], ["x"]

    move(source, target, "a", 9)

    assert (source, target) == (["b"], ["x", "a"])
