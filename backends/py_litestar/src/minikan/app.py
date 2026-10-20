from litestar import Litestar, Router, get


@get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


api = Router(path="/api", route_handlers=[health])

app = Litestar(route_handlers=[api])
