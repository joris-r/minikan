import asyncio
import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from sqlalchemy.orm import joinedload

from minikan.models import Session, User

SESSION_LIFETIME = timedelta(days=7)

hasher = PasswordHasher()

# Verified against when the name is unknown, so that a login takes as long either way.
UNKNOWN_USER_HASH = hasher.hash(secrets.token_urlsafe())


def hash_password(password: str) -> str:
    return hasher.hash(password)


# Argon2 is slow by design, so it runs in a thread, not on the event loop.
async def verify_password(password_hash: str, password: str) -> bool:
    try:
        return await asyncio.to_thread(hasher.verify, password_hash, password)
    except VerificationError:
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class UserService(SQLAlchemyAsyncRepositoryService[User]):
    class Repository(SQLAlchemyAsyncRepository[User]):
        model_type = User

    repository_type = Repository

    async def authenticate(self, name: str, password: str) -> User | None:
        user = await self.get_one_or_none(name=name)
        password_hash = user.password_hash if user else UNKNOWN_USER_HASH
        if await verify_password(password_hash, password):
            return user
        return None


class SessionService(SQLAlchemyAsyncRepositoryService[Session]):
    class Repository(SQLAlchemyAsyncRepository[Session]):
        model_type = Session

    repository_type = Repository

    # Returns the token of a new session of `user`.
    async def open(self, user: User) -> str:
        token = secrets.token_urlsafe(32)
        await self.create(
            Session(
                token_hash=hash_token(token),
                user_id=user.id,
                expires_at=datetime.now(UTC) + SESSION_LIFETIME,
            )
        )
        return token

    async def find(self, token: str) -> Session | None:
        return await self.get_one_or_none(
            Session.token_hash == hash_token(token),
            Session.expires_at > datetime.now(UTC),
            load=[joinedload(Session.user)],
        )
