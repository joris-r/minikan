from typing import Annotated, Any
from uuid import UUID

import msgspec
from advanced_alchemy.extensions.litestar.providers import create_service_provider
from litestar import Controller, get, patch, post
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


def item(entity: Board | Column | Card) -> dict[str, str]:
    return {"id": str(entity.id), "title": entity.title}


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
    async def list_boards(self, boards_service: Boards, user: CurrentUser) -> list[dict[str, str]]:
        return [item(board) for board in await boards_service.get_many(Board.user_id == user.id)]

    @post("/")
    async def create_board(self, boards_service: Boards, user: CurrentUser) -> dict[str, str]:
        return item(await boards_service.create(Board(user_id=user.id, title="")))

    @get("/{board_id:str}")
    async def get_board(
        self,
        boards_service: Boards,
        columns_service: Columns,
        user: CurrentUser,
        board_id: FromPath[str],
    ) -> dict[str, Any]:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        columns = await columns_service.get_many(
            Column.board_id == board.id, load=[selectinload(Column.cards)]
        )
        return {
            **item(board),
            "columns": [
                {**item(column), "cards": [item(card) for card in column.cards]}
                for column in columns
            ],
        }

    @patch("/{board_id:str}")
    async def set_board_title(
        self,
        boards_service: Boards,
        user: CurrentUser,
        board_id: FromPath[str],
        data: JSONBody[TitleIn],
    ) -> dict[str, str]:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        board.title = data.title
        return item(await boards_service.update(board))

    @post("/{board_id:str}/columns")
    async def create_column(
        self,
        boards_service: Boards,
        columns_service: Columns,
        user: CurrentUser,
        board_id: FromPath[str],
    ) -> dict[str, str]:
        board = await boards_service.get_owned(parse_id(board_id), user.id)
        return item(await columns_service.create(Column(board_id=board.id, title="")))


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
    ) -> dict[str, str]:
        column = await columns_service.get_owned(parse_id(column_id), user.id)
        column.title = data.title
        return item(await columns_service.update(column))

    @post("/{column_id:str}/cards")
    async def create_card(
        self,
        columns_service: Columns,
        cards_service: Cards,
        user: CurrentUser,
        column_id: FromPath[str],
    ) -> dict[str, str]:
        column = await columns_service.get_owned(parse_id(column_id), user.id)
        return item(await cards_service.create(Card(column_id=column.id, title="")))


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
    ) -> dict[str, str]:
        card = await cards_service.get_owned(parse_id(card_id), user.id)
        card.title = data.title
        return item(await cards_service.update(card))
