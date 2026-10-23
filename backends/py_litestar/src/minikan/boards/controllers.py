from typing import Annotated
from uuid import UUID

import msgspec
from advanced_alchemy.extensions.litestar.providers import create_service_provider
from litestar import Controller, delete, get, patch, post
from litestar.di import NamedDependency
from litestar.exceptions import NotFoundException
from litestar.params import FromPath, JSONBody
from sqlalchemy.orm import selectinload

from minikan.accounts.dependencies import CurrentUser
from minikan.boards.services import BoardService, CardService, ColumnService
from minikan.models import TITLE_MAX_LENGTH, Board, Card, Column

Boards = NamedDependency[BoardService]
Columns = NamedDependency[ColumnService]
Cards = NamedDependency[CardService]


class TitleIn(msgspec.Struct):
    title: Annotated[str, msgspec.Meta(max_length=TITLE_MAX_LENGTH)]


class ItemOut(msgspec.Struct):
    id: UUID
    title: str

    @classmethod
    def of(cls, entity: Board | Column | Card) -> ItemOut:
        return cls(id=entity.id, title=entity.title)


class ColumnOut(msgspec.Struct):
    id: UUID
    title: str
    cards: list[ItemOut]


class BoardOut(msgspec.Struct):
    id: UUID
    title: str
    columns: list[ColumnOut]


def parse_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise NotFoundException() from None


class BoardController(Controller):
    path = "/boards"
    dependencies = {
        "boards_service": create_service_provider(BoardService),
        "columns_service": create_service_provider(ColumnService),
    }

    @get("/")
    async def list_boards(self, boards_service: Boards, user: CurrentUser) -> list[ItemOut]:
        return [
            ItemOut.of(board) for board in await boards_service.get_many(Board.user_id == user.id)
        ]

    @post("/")
    async def create_board(self, boards_service: Boards, user: CurrentUser) -> ItemOut:
        return ItemOut.of(await boards_service.create(Board(user_id=user.id, title="")))

    @get("/{board_id:str}")
    async def get_board(
        self,
        boards_service: Boards,
        columns_service: Columns,
        user: CurrentUser,
        board_id: FromPath[str],
    ) -> BoardOut:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        columns = await columns_service.get_many(
            Column.board_id == board.id, load=[selectinload(Column.cards)]
        )
        return BoardOut(
            id=board.id,
            title=board.title,
            columns=[
                ColumnOut(
                    id=column.id,
                    title=column.title,
                    cards=[ItemOut.of(card) for card in column.cards],
                )
                for column in columns
            ],
        )

    @patch("/{board_id:str}")
    async def set_board_title(
        self,
        boards_service: Boards,
        user: CurrentUser,
        board_id: FromPath[str],
        data: JSONBody[TitleIn],
    ) -> ItemOut:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        board.title = data.title
        return ItemOut.of(await boards_service.update(board))

    @delete("/{board_id:str}")
    async def delete_board(
        self, boards_service: Boards, user: CurrentUser, board_id: FromPath[str]
    ) -> None:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        await boards_service.delete(board.id)

    @post("/{board_id:str}/columns")
    async def create_column(
        self,
        boards_service: Boards,
        columns_service: Columns,
        user: CurrentUser,
        board_id: FromPath[str],
    ) -> ItemOut:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        return ItemOut.of(await columns_service.create(Column(board_id=board.id, title="")))


class ColumnController(Controller):
    path = "/columns"
    dependencies = {
        "columns_service": create_service_provider(ColumnService),
        "cards_service": create_service_provider(CardService),
    }

    @patch("/{column_id:str}")
    async def set_column_title(
        self,
        columns_service: Columns,
        user: CurrentUser,
        column_id: FromPath[str],
        data: JSONBody[TitleIn],
    ) -> ItemOut:
        column = await columns_service.get_owned(parse_id(column_id), user.id)
        column.title = data.title
        return ItemOut.of(await columns_service.update(column))

    @delete("/{column_id:str}")
    async def delete_column(
        self, columns_service: Columns, user: CurrentUser, column_id: FromPath[str]
    ) -> None:
        column = await columns_service.get_owned(parse_id(column_id), user.id)
        await columns_service.delete(column.id)

    @post("/{column_id:str}/cards")
    async def create_card(
        self,
        columns_service: Columns,
        cards_service: Cards,
        user: CurrentUser,
        column_id: FromPath[str],
    ) -> ItemOut:
        column = await columns_service.get_owned(parse_id(column_id), user.id)
        return ItemOut.of(await cards_service.create(Card(column_id=column.id, title="")))


class CardController(Controller):
    path = "/cards"
    dependencies = {"cards_service": create_service_provider(CardService)}

    @patch("/{card_id:str}")
    async def set_card_title(
        self,
        cards_service: Cards,
        user: CurrentUser,
        card_id: FromPath[str],
        data: JSONBody[TitleIn],
    ) -> ItemOut:
        card = await cards_service.get_owned(parse_id(card_id), user.id)
        card.title = data.title
        return ItemOut.of(await cards_service.update(card))

    @delete("/{card_id:str}")
    async def delete_card(
        self, cards_service: Cards, user: CurrentUser, card_id: FromPath[str]
    ) -> None:
        card = await cards_service.get_owned(parse_id(card_id), user.id)
        await cards_service.delete(card.id)
