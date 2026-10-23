from uuid import UUID

from advanced_alchemy.base import UUIDv7Base
from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.ext.orderinglist import OrderingList, ordering_list
from sqlalchemy.orm import Mapped, mapped_column, relationship

TITLE_MAX_LENGTH = 100


class User(UUIDv7Base):
    name: Mapped[str] = mapped_column(String, unique=True)


class Board(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    user_id: Mapped[UUID] = mapped_column(ForeignKey("user.id"))
    columns: Mapped[OrderingList[Column]] = relationship(
        back_populates="board",
        lazy="raise",
        passive_deletes=True,
        order_by="Column.position",
        collection_class=ordering_list("position", count_from=1),
    )


class Column(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    board_id: Mapped[UUID] = mapped_column(ForeignKey("board.id", ondelete="CASCADE"))
    # From 1 in its board, kept by Board.columns; deletions leave gaps.
    position: Mapped[int] = mapped_column(Integer)
    board: Mapped[Board] = relationship(back_populates="columns", lazy="raise")
    cards: Mapped[OrderingList[Card]] = relationship(
        back_populates="column",
        lazy="raise",
        passive_deletes=True,
        order_by="Card.position",
        collection_class=ordering_list("position", count_from=1),
    )


class Card(UUIDv7Base):
    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH), default="")
    column_id: Mapped[UUID] = mapped_column(ForeignKey("column.id", ondelete="CASCADE"))
    # From 1 in its column, kept by Column.cards; deletions leave gaps.
    position: Mapped[int] = mapped_column(Integer)
    column: Mapped[Column] = relationship(back_populates="cards", lazy="raise")
