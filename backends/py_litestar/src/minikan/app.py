from advanced_alchemy.exceptions import NotFoundError
from advanced_alchemy.extensions.litestar import SQLAlchemyPlugin
from litestar import Litestar, Request, Response, Router, get
from litestar.di import Provide
from litestar.exceptions import HTTPException, NotFoundException

from minikan.accounts.dependencies import current_user, provide_users_service
from minikan.boards.controllers import BoardController, CardController, ColumnController
from minikan.db import create_storage, db_config, remove_temp_storage


# Belongs to no domain, so it stays with the assembly.
@get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


def error_handler(_: Request, exc: HTTPException) -> Response[dict[str, str]]:
    return Response({"error": exc.detail}, status_code=exc.status_code)


def not_found_handler(request: Request, _: NotFoundError) -> Response[dict[str, str]]:
    return error_handler(request, NotFoundException())


def internal_error_handler(_: Request, __: Exception) -> Response[dict[str, str]]:
    return Response({"error": "Internal Server Error"}, status_code=500)


authenticated = Router(
    path="/",
    dependencies={"users_service": provide_users_service, "user": Provide(current_user)},
    route_handlers=[BoardController, ColumnController, CardController],
)

api = Router(path="/api", route_handlers=[health, authenticated])

app = Litestar(
    route_handlers=[api],
    plugins=[SQLAlchemyPlugin(config=db_config)],
    on_startup=[create_storage],
    on_shutdown=[remove_temp_storage],
    exception_handlers={
        HTTPException: error_handler,
        NotFoundError: not_found_handler,
        Exception: internal_error_handler,
    },
)
