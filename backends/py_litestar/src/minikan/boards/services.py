from collections.abc import Sequence
from uuid import UUID

from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService
from sqlalchemy import select
from sqlalchemy.orm.strategy_options import _AbstractLoad

from minikan.models import Board, Card, Column


class BoardService(SQLAlchemyAsyncRepositoryService[Board]):
    class Repository(SQLAlchemyAsyncRepository[Board]):
        model_type = Board

    repository_type = Repository

    async def get_owned(
        self, board_id: UUID, user_id: UUID, load: Sequence[_AbstractLoad] = ()
    ) -> Board:
        return await self.get_one(Board.id == board_id, Board.user_id == user_id, load=load)


class ColumnService(SQLAlchemyAsyncRepositoryService[Column]):
    class Repository(SQLAlchemyAsyncRepository[Column]):
        model_type = Column

    repository_type = Repository

    async def get_owned(
        self, column_id: UUID, user_id: UUID, load: Sequence[_AbstractLoad] = ()
    ) -> Column:
        return await self.get_one(
            Column.id == column_id,
            Board.user_id == user_id,
            statement=select(Column).join(Board),
            load=load,
        )


class CardService(SQLAlchemyAsyncRepositoryService[Card]):
    class Repository(SQLAlchemyAsyncRepository[Card]):
        model_type = Card

    repository_type = Repository

    async def get_owned(
        self, card_id: UUID, user_id: UUID, load: Sequence[_AbstractLoad] = ()
    ) -> Card:
        return await self.get_one(
            Card.id == card_id,
            Board.user_id == user_id,
            statement=select(Card).join(Column).join(Board),
            load=load,
        )


# Moves `item` from `source` into `target`, possibly the same list, at a position counted from 1
# and clamped to the target's bounds (R8). The ordering lists renumber their elements.
def move[T](source: list[T], target: list[T], item: T, position: int) -> None:
    source.remove(item)
    target.insert(min(max(position, 1), len(target) + 1) - 1, item)
