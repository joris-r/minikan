import os
import shutil
import tempfile
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID

import msgspec
from advanced_alchemy.base import orm_registry
from advanced_alchemy.extensions.litestar import (
    AsyncSessionConfig,
    SQLAlchemyAsyncConfig,
    SQLAlchemyPlugin,
)
from litestar import Litestar, Request, Response, Router, get, patch, post
from litestar.di import NamedDependency, Provide
from litestar.exceptions import HTTPException, NotAuthorizedException, NotFoundException
from litestar.params import FromPath, JSONBody
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from minikan.models import TITLE_MAX_LENGTH, Board, Card, Column, User

SEEDED_USERS = ["demo", "other"]

TEMP_STORAGE = os.environ.get("TEMP_STORAGE") == "1"
DATABASE_PATH = (
    Path(tempfile.mkdtemp(prefix="minikan-") if TEMP_STORAGE else ".") / "minikan.sqlite3"
)

db_config = SQLAlchemyAsyncConfig(
    connection_string=f"sqlite+aiosqlite:///{DATABASE_PATH}",
    session_config=AsyncSessionConfig(expire_on_commit=False),
    before_send_handler="autocommit",
)

DbSession = NamedDependency[AsyncSession]
CurrentUser = NamedDependency[User]


class TitleIn(msgspec.Struct):
    title: Annotated[str, msgspec.Meta(max_length=TITLE_MAX_LENGTH)]


def _item(entity: Board | Column | Card) -> dict[str, str]:
    return {"id": str(entity.id), "title": entity.title}


def _parse_id(value: str) -> UUID:
    try:
        return UUID(value)
    except ValueError:
        raise NotFoundException() from None


async def current_user(request: Request, db_session: DbSession) -> User:
    scheme, _, name = request.headers.get("Authorization", "").partition(" ")
    user = None
    if scheme == "Bearer" and name:
        user = await db_session.scalar(select(User).where(User.name == name))
    if user is None:
        raise NotAuthorizedException()
    return user


async def _board(db_session: AsyncSession, user: User, board_id: FromPath[str]) -> Board:
    board = await db_session.scalar(
        select(Board).where(Board.id == _parse_id(board_id), Board.user_id == user.id)
    )
    if board is None:
        raise NotFoundException()
    return board


async def _column(db_session: AsyncSession, user: User, column_id: FromPath[str]) -> Column:
    column = await db_session.scalar(
        select(Column)
        .join(Board)
        .where(Column.id == _parse_id(column_id), Board.user_id == user.id)
    )
    if column is None:
        raise NotFoundException()
    return column


async def _card(db_session: AsyncSession, user: User, card_id: FromPath[str]) -> Card:
    card = await db_session.scalar(
        select(Card)
        .join(Column)
        .join(Board)
        .where(Card.id == _parse_id(card_id), Board.user_id == user.id)
    )
    if card is None:
        raise NotFoundException()
    return card


async def _created(db_session: AsyncSession, entity: Board | Column | Card) -> dict[str, str]:
    db_session.add(entity)
    await db_session.flush()
    return _item(entity)


@get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@get("/boards")
async def list_boards(db_session: DbSession, user: CurrentUser) -> list[dict[str, str]]:
    boards = await db_session.scalars(select(Board).where(Board.user_id == user.id))
    return [_item(board) for board in boards]


@post("/boards")
async def create_board(db_session: DbSession, user: CurrentUser) -> dict[str, str]:
    return await _created(db_session, Board(user_id=user.id, title=""))


@get("/boards/{board_id:str}")
async def get_board(
    db_session: DbSession, user: CurrentUser, board_id: FromPath[str]
) -> dict[str, Any]:
    board = await _board(db_session, user, board_id)
    columns = await db_session.scalars(
        select(Column).where(Column.board_id == board.id).options(selectinload(Column.cards))
    )
    return {
        **_item(board),
        "columns": [
            {**_item(column), "cards": [_item(card) for card in column.cards]} for column in columns
        ],
    }


@patch("/boards/{board_id:str}")
async def set_board_title(
    db_session: DbSession, user: CurrentUser, board_id: FromPath[str], data: JSONBody[TitleIn]
) -> dict[str, str]:
    board = await _board(db_session, user, board_id)
    board.title = data.title
    return _item(board)


@post("/boards/{board_id:str}/columns")
async def create_column(
    db_session: DbSession, user: CurrentUser, board_id: FromPath[str]
) -> dict[str, str]:
    board = await _board(db_session, user, board_id)
    return await _created(db_session, Column(board_id=board.id, title=""))


@patch("/columns/{column_id:str}")
async def set_column_title(
    db_session: DbSession, user: CurrentUser, column_id: FromPath[str], data: JSONBody[TitleIn]
) -> dict[str, str]:
    column = await _column(db_session, user, column_id)
    column.title = data.title
    return _item(column)


@post("/columns/{column_id:str}/cards")
async def create_card(
    db_session: DbSession, user: CurrentUser, column_id: FromPath[str]
) -> dict[str, str]:
    column = await _column(db_session, user, column_id)
    return await _created(db_session, Card(column_id=column.id, title=""))


@patch("/cards/{card_id:str}")
async def set_card_title(
    db_session: DbSession, user: CurrentUser, card_id: FromPath[str], data: JSONBody[TitleIn]
) -> dict[str, str]:
    card = await _card(db_session, user, card_id)
    card.title = data.title
    return _item(card)


def error_handler(_: Request, exc: HTTPException) -> Response[dict[str, str]]:
    return Response({"error": exc.detail}, status_code=exc.status_code)


def internal_error_handler(_: Request, __: Exception) -> Response[dict[str, str]]:
    return Response({"error": "Internal Server Error"}, status_code=500)


async def create_storage() -> None:
    # The directory is recreated when the app starts again in the same process (unit tests).
    DATABASE_PATH.parent.mkdir(exist_ok=True)
    engine = db_config.get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(orm_registry.metadata.create_all)
        existing = set(await conn.scalars(select(User.name)))
        missing = [{"name": name} for name in SEEDED_USERS if name not in existing]
        if missing:
            await conn.execute(User.__table__.insert(), missing)


# The temp directory is removed here, not at exit: uvicorn's reload worker skips exit hooks.
async def remove_temp_storage() -> None:
    if TEMP_STORAGE:
        await db_config.get_engine().dispose()
        shutil.rmtree(DATABASE_PATH.parent, ignore_errors=True)


authenticated = Router(
    path="/",
    dependencies={"user": Provide(current_user)},
    route_handlers=[
        list_boards,
        create_board,
        get_board,
        set_board_title,
        create_column,
        set_column_title,
        create_card,
        set_card_title,
    ],
)

api = Router(path="/api", route_handlers=[health, authenticated])

app = Litestar(
    route_handlers=[api],
    plugins=[SQLAlchemyPlugin(config=db_config)],
    on_startup=[create_storage],
    on_shutdown=[remove_temp_storage],
    exception_handlers={HTTPException: error_handler, Exception: internal_error_handler},
)
