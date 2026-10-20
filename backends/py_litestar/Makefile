.PHONY: setup run check

PORT ?= 8000

setup:
	uv sync

run:
	uv run uvicorn minikan.app:app --reload --port $(PORT)

check:
	uv run ruff check .
	uv run ruff format --check .
	uv run pytest
