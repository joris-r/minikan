from uuid import UUID

from advanced_alchemy.base import UUIDv7Base
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

TITLE_MAX_LENGTH = 100


class User(UUIDv7Base):
    name: Mapped[str] = mapped_column(String, unique=True)


class Board(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    columns: Mapped[list[Column]] = relationship(back_populates="board", lazy="raise")


class Column(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    board_id: Mapped[UUID] = mapped_column(ForeignKey("board.id"))
    board: Mapped[Board] = relationship(back_populates="columns", lazy="raise")
    cards: Mapped[list[Card]] = relationship(back_populates="column", lazy="raise")


class Card(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    column_id: Mapped[UUID] = mapped_column(ForeignKey("column.id"))
    column: Mapped[Column] = relationship(back_populates="cards", lazy="raise")
