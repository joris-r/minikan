from uuid import UUID

from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService
from sqlalchemy import select

from minikan.models import Board, Card, Column


class BoardService(SQLAlchemyAsyncRepositoryService[Board]):
    class Repository(SQLAlchemyAsyncRepository[Board]):
        model_type = Board

    repository_type = Repository

    async def get_owned(self, board_id: UUID, user_id: UUID) -> Board:
        return await self.get_one(Board.id == board_id, Board.user_id == user_id)


class ColumnService(SQLAlchemyAsyncRepositoryService[Column]):
    class Repository(SQLAlchemyAsyncRepository[Column]):
        model_type = Column

    repository_type = Repository

    async def get_owned(self, column_id: UUID, user_id: UUID) -> Column:
        return await self.get_one(
            Column.id == column_id,
            Board.user_id == user_id,
            statement=select(Column).join(Board),
        )


class CardService(SQLAlchemyAsyncRepositoryService[Card]):
    class Repository(SQLAlchemyAsyncRepository[Card]):
        model_type = Card

    repository_type = Repository

    async def get_owned(self, card_id: UUID, user_id: UUID) -> Card:
        return await self.get_one(
            Card.id == card_id,
            Board.user_id == user_id,
            statement=select(Card).join(Column).join(Board),
        )
