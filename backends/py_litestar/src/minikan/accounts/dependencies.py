from advanced_alchemy.extensions.litestar.providers import create_service_provider
from litestar import Request
from litestar.di import NamedDependency
from litestar.exceptions import NotAuthorizedException

from minikan.accounts.services import SessionService, UserService
from minikan.models import Session, User

SESSION_COOKIE = "session"

provide_users_service = create_service_provider(UserService)
provide_sessions_service = create_service_provider(SessionService)

CurrentSession = NamedDependency[Session]
CurrentUser = NamedDependency[User]


async def current_session(
    request: Request, sessions_service: NamedDependency[SessionService]
) -> Session:
    token = request.cookies.get(SESSION_COOKIE)
    session = await sessions_service.find(token) if token else None
    if session is None:
        raise NotAuthorizedException()
    return session


async def current_user(session: CurrentSession) -> User:
    return session.user
