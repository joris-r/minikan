import msgspec
from litestar import Controller, Response, get, post
from litestar.datastructures import Cookie
from litestar.di import NamedDependency
from litestar.exceptions import NotAuthorizedException
from litestar.params import JSONBody

from minikan.accounts.dependencies import SESSION_COOKIE, CurrentSession, CurrentUser
from minikan.accounts.services import SESSION_LIFETIME, SessionService, UserService

Users = NamedDependency[UserService]
Sessions = NamedDependency[SessionService]


class LoginIn(msgspec.Struct):
    name: str
    password: str


class SessionOut(msgspec.Struct):
    name: str


def session_cookie(token: str, max_age: int) -> Cookie:
    return Cookie(
        key=SESSION_COOKIE,
        value=token,
        path="/api",
        max_age=max_age,
        httponly=True,
        secure=True,
        samesite="strict",
    )


# Login needs no session, so it stays out of the authenticated router.
class LoginController(Controller):
    path = "/login"

    @post("/", status_code=204)
    async def log_in(
        self, data: JSONBody[LoginIn], users_service: Users, sessions_service: Sessions
    ) -> Response[None]:
        user = await users_service.authenticate(data.name, data.password)
        if user is None:
            raise NotAuthorizedException("Invalid name or password")
        token = await sessions_service.open(user)
        max_age = int(SESSION_LIFETIME.total_seconds())
        return Response(None, status_code=204, cookies=[session_cookie(token, max_age)])


class SessionController(Controller):
    path = "/"

    @get("/session")
    async def get_session(self, user: CurrentUser) -> SessionOut:
        return SessionOut(name=user.name)

    @post("/logout", status_code=204)
    async def log_out(self, sessions_service: Sessions, session: CurrentSession) -> Response[None]:
        await sessions_service.delete(session.id)
        return Response(None, status_code=204, cookies=[session_cookie("", 0)])
