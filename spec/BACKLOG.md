# Backlog

- Backend py_litestar: Litestar DTOs (`SQLAlchemyDTO`) would replace the hand-built response dicts and `TitleIn`.
- Backend py_litestar: services scoped to the current user (provider `statement`) would filter every query by owner, instead of each handler calling `get_owned`.
