from advanced_alchemy.repository import SQLAlchemyAsyncRepository
from advanced_alchemy.service import SQLAlchemyAsyncRepositoryService

from minikan.models import User


class UserService(SQLAlchemyAsyncRepositoryService[User]):
    class Repository(SQLAlchemyAsyncRepository[User]):
        model_type = User

    repository_type = Repository
