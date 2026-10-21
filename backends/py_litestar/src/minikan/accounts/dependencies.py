from advanced_alchemy.extensions.litestar.providers import create_service_provider
from litestar import Request
from litestar.di import NamedDependency
from litestar.exceptions import NotAuthorizedException

from minikan.accounts.services import UserService
from minikan.models import User

provide_users_service = create_service_provider(UserService)

CurrentUser = NamedDependency[User]


async def current_user(request: Request, users_service: NamedDependency[UserService]) -> User:
    scheme, _, name = request.headers.get("Authorization", "").partition(" ")
    user = None
    if scheme == "Bearer" and name:
        user = await users_service.get_one_or_none(name=name)
    if user is None:
        raise NotAuthorizedException()
    return user
