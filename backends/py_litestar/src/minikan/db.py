import os
import shutil
import tempfile
from pathlib import Path

from advanced_alchemy.base import orm_registry
from advanced_alchemy.extensions.litestar import AsyncSessionConfig, SQLAlchemyAsyncConfig

from minikan.accounts.services import UserService
from minikan.models import User

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


async def create_storage() -> None:
    # The directory is recreated when the app starts again in the same process (unit tests).
    DATABASE_PATH.parent.mkdir(exist_ok=True)
    async with db_config.get_engine().begin() as conn:
        await conn.run_sync(orm_registry.metadata.create_all)
    async with UserService.new(config=db_config) as users_service:
        existing = {user.name for user in await users_service.get_many()}
        missing = [User(name=name) for name in SEEDED_USERS if name not in existing]
        if missing:
            await users_service.create_many(missing, auto_commit=True)


# The temp directory is removed here, not at exit: uvicorn's reload worker skips exit hooks.
async def remove_temp_storage() -> None:
    if TEMP_STORAGE:
        await db_config.get_engine().dispose()
        shutil.rmtree(DATABASE_PATH.parent, ignore_errors=True)
